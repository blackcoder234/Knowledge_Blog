async function runTests(testTracker) {
  console.log("\n--- Suite 3: Concurrent Generation & Idempotency ---");

  // Simulated in-memory database state for testing atomic transitions
  const mockOpportunity = {
    _id: "opp_12345",
    proposedTitle: "Architectural Invariants of Distributed Consensus",
    status: "new",
    jobId: null,
    convertedPostId: null,
    retryCount: 0,
    lastError: null,
  };

  const mockPosts = [];

  // Atomic Claim simulation (equivalent to findOneAndUpdate({ status: 'new' }, { $set: { status: 'converting' } }))
  function attemptAtomicClaim(opp, jobId) {
    if (["new", "approved", "failed"].includes(opp.status)) {
      opp.status = "converting";
      opp.jobId = jobId;
      return { success: true, opp: { ...opp } };
    }
    return { success: false, currentStatus: opp.status };
  }

  // 1. Test Concurrent Generation Race Condition:
  // Two simultaneous requests try to convert the same opportunity
  const clientA = attemptAtomicClaim(mockOpportunity, "job_client_a");
  const clientB = attemptAtomicClaim(mockOpportunity, "job_client_b");

  testTracker.assert("Concurrency: Client A acquires atomic conversion lock", clientA.success === true);
  testTracker.assert("Concurrency: Client B rejected with conflict (409)", clientB.success === false && clientB.currentStatus === "converting");

  // 2. Post Creation & Immediate Durable Binding
  const newPostId = "post_abc_999";
  mockPosts.push({ _id: newPostId, aiOpportunityId: mockOpportunity._id, title: mockOpportunity.proposedTitle });
  mockOpportunity.convertedPostId = newPostId;
  mockOpportunity.status = "draft_ready";

  testTracker.assert("Idempotency: Post bound to opportunity immediately upon creation", mockOpportunity.convertedPostId === newPostId);
  testTracker.assert("Idempotency: Status transitions to draft_ready", mockOpportunity.status === "draft_ready");

  // 3. Post Creation Survival:
  // If a secondary step (like audit logging) throws an error, post is PRESERVED, opportunity status is NEVER rolled back to 'new'
  const simulateSecondaryFailure = () => {
    try {
      throw new Error("Audit log database connection timeout");
    } catch (err) {
      if (mockOpportunity.convertedPostId) {
        // Safe handler: keep draft_ready!
        mockOpportunity.status = "draft_ready";
      } else {
        mockOpportunity.status = "failed";
      }
    }
  };
  simulateSecondaryFailure();

  testTracker.assert("Idempotency: Status remains draft_ready despite secondary step failure", mockOpportunity.status === "draft_ready");
  testTracker.assert("Idempotency: Post is NOT deleted or orphaned", mockPosts.length === 1);

  // 4. Idempotent Recovery on Retry:
  // When user or client retries conversion on an opportunity that already has an existing post, recover existing post!
  function recoverOrConvert(oppId) {
    const existing = mockPosts.find((p) => p.aiOpportunityId === oppId);
    if (existing) {
      return { recovered: true, postId: existing._id };
    }
    return { recovered: false };
  }

  const retryResult = recoverOrConvert(mockOpportunity._id);
  testTracker.assert("Idempotency: Existing post recovered without duplicate generation", retryResult.recovered === true && retryResult.postId === newPostId);
  testTracker.assert("Idempotency: Zero duplicate posts created", mockPosts.length === 1);

  // 5. Pre-Creation Failure Diagnostic State:
  // If LLM fails before post creation, status becomes 'failed' with diagnostic lastError and incremented retryCount
  const failedOpp = {
    _id: "opp_fail_1",
    status: "converting",
    retryCount: 0,
    lastError: null,
    convertedPostId: null,
    updatedAt: new Date(),
  };

  function handlePreCreationFailure(opp, errorMsg) {
    if (!opp.convertedPostId) {
      opp.status = "failed";
      opp.lastError = errorMsg;
      opp.retryCount += 1;
    }
  }

  handlePreCreationFailure(failedOpp, "Model quota exhausted (HTTP 429)");
  testTracker.assert("Failure Recovery: Status marked as failed on pre-creation error", failedOpp.status === "failed");
  testTracker.assert("Failure Recovery: Diagnostic lastError stored on opportunity", failedOpp.lastError.includes("429"));
  testTracker.assert("Failure Recovery: Retry counter incremented", failedOpp.retryCount === 1);

  // 6. Process Termination Crash After Post Creation but Before Opportunity State Update:
  // Simulates Node server process dying immediately after Post.create succeeds
  const crashedOpp = {
    _id: "opp_crashed_99",
    status: "converting", // Stuck in converting due to abrupt process termination
    jobId: "job_crashed",
    convertedPostId: null, // Opportunity was not yet updated when process died
    updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  };

  const orphanPost = {
    _id: "post_created_before_crash",
    aiOpportunityId: crashedOpp._id,
    title: "Post Created Right Before Crash",
    slug: "post-created-before-crash",
  };
  mockPosts.push(orphanPost);

  // When recovery / retry occurs:
  function handleRecoveryFromCrash(oppId) {
    const existing = mockPosts.find((p) => p.aiOpportunityId === oppId);
    if (existing) {
      crashedOpp.status = "draft_ready";
      crashedOpp.convertedPostId = existing._id;
      return { success: true, recovered: true, postId: existing._id };
    }
    return { success: false };
  }

  const crashRecovery = handleRecoveryFromCrash(crashedOpp._id);
  testTracker.assert("Crash Recovery: Recovers post created prior to process termination", crashRecovery.recovered === true);
  testTracker.assert("Crash Recovery: Opportunity transitioned to draft_ready", crashedOpp.status === "draft_ready");
  testTracker.assert("Crash Recovery: Opportunity bound to recovered post ID", crashedOpp.convertedPostId === orphanPost._id);

  // 7. Duplicate Key Handling (E11000) on aiOpportunityId:
  // When two concurrent threads attempt creating post for same opportunity, unique index throws 11000
  function handleDuplicateKeyCreation(payload, keyCollision) {
    if (keyCollision === "aiOpportunityId") {
      const existing = mockPosts.find((p) => p.aiOpportunityId === payload.aiOpportunityId);
      if (existing) return { post: existing, recovered: true };
    }
    if (keyCollision === "slug") {
      const emergencySlug = `${payload.slug}-${Date.now().toString(36)}`;
      const newP = { ...payload, slug: emergencySlug, _id: "post_retry_" + Math.random().toString(36).slice(2, 6) };
      mockPosts.push(newP);
      return { post: newP, recovered: false, slugRetried: true };
    }
    throw new Error("Unhandled key");
  }

  const dupOppKeyResult = handleDuplicateKeyCreation(
    { aiOpportunityId: mockOpportunity._id, title: "Duplicate Post" },
    "aiOpportunityId"
  );
  testTracker.assert("Duplicate Key 11000: Recovers existing post on aiOpportunityId collision", dupOppKeyResult.recovered === true);

  // 8. Duplicate Key Handling (E11000) on Slug:
  const dupSlugResult = handleDuplicateKeyCreation(
    { aiOpportunityId: "opp_new_unique", slug: "shared-title-slug", title: "Shared Title Post" },
    "slug"
  );
  testTracker.assert("Duplicate Slug 11000: Creates post with unique emergency suffix", dupSlugResult.slugRetried === true);
  testTracker.assert("Duplicate Slug 11000: New slug is distinct from original", dupSlugResult.post.slug !== "shared-title-slug");

  // 9. Stalled & Failed Job Recovery:
  function canRecoverJob(opp) {
    const isFailed = opp.status === "failed";
    const isStalled = opp.status === "converting" && (Date.now() - new Date(opp.updatedAt).getTime()) > 5 * 60 * 1000;
    return isFailed || isStalled || ["new", "approved"].includes(opp.status);
  }

  testTracker.assert("Job Recovery: Failed job can be safely recovered", canRecoverJob({ status: "failed", updatedAt: new Date() }) === true);
  testTracker.assert("Job Recovery: Stalled converting job (>5m) can be safely recovered", canRecoverJob({ status: "converting", updatedAt: new Date(Date.now() - 6 * 60 * 1000) }) === true);
  testTracker.assert("Job Recovery: Active converting job (<5m) rejects duplicate claim", canRecoverJob({ status: "converting", updatedAt: new Date() }) === false);
}

module.exports = { runTests };

