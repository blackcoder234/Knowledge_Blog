const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const mongoose = require("mongoose");
const AIRateLimit = require("../../models/AIRateLimit.ts").default;
const AIContentOpportunity = require("../../models/AIContentOpportunity.ts").default;
const AIResearchSource = require("../../models/AIResearchSource.ts").default;
const Post = require("../../models/Post.ts").default;
const {
  claimConversionJob,
  failConversionJob,
  recoverConversionPost,
  renewConversionLease,
} = require("../../lib/ai-studio/conversionJobs.ts");
const {
  checkDistributedRateLimit,
  reserveDailyQuota,
  reserveDailyResearchFetch,
} = require("../../lib/ai-studio/rateLimiter.ts");
const { syncResearchSource } = require("../../lib/ai-studio/researchFetcher.ts");
const dbConnect = require("../../lib/db.ts").default;

function assertTest(tracker, description, condition) {
  tracker.assert(`MongoDB integration: ${description}`, condition);
}

async function testDistributedLimiter(tracker) {
  const maxRequests = 7;
  const results = await Promise.all(
    Array.from({ length: 32 }, () =>
      checkDistributedRateLimit(
        `integration-${new mongoose.Types.ObjectId()}`,
        "draft_convert",
        { maxRequests, windowMs: 60_000 },
      ),
    ),
  );
  const identifier = `shared-${new mongoose.Types.ObjectId()}`;
  const concurrent = await Promise.all(
    Array.from({ length: 32 }, () =>
      checkDistributedRateLimit(identifier, "draft_convert", {
        maxRequests,
        windowMs: 60_000,
      }),
    ),
  );
  assertTest(
    tracker,
    "the production distributed limiter allows exactly the configured concurrent requests",
    concurrent.filter((result) => result.allowed).length === maxRequests,
  );
  const exhausted = await checkDistributedRateLimit(identifier, "draft_convert", {
    maxRequests,
    windowMs: 60_000,
  });
  assertTest(
    tracker,
    "a request after distributed-window exhaustion is denied",
    !exhausted.allowed && exhausted.remaining === 0,
  );
  assertTest(
    tracker,
    "independent identifiers receive independent distributed buckets",
    results.every((result) => result.allowed),
  );
}

async function testDailyQuotaReservations(tracker) {
  const dailyLimit = 6;
  const reservations = await Promise.all(
    Array.from({ length: 30 }, () =>
      reserveDailyQuota("draft_generation", dailyLimit),
    ),
  );
  assertTest(
    tracker,
    "the production daily quota atomically allows exactly the remaining quota under concurrency",
    reservations.filter((reservation) => reservation.allowed).length === dailyLimit,
  );
  const denied = await reserveDailyQuota("draft_generation", dailyLimit);
  assertTest(
    tracker,
    "daily quota requests after exhaustion are denied without incrementing the counter",
    !denied.allowed && denied.current === dailyLimit,
  );

  const beforeUtcMidnight = new Date("2036-10-30T23:59:59.000Z");
  const afterUtcMidnight = new Date("2036-10-31T00:00:00.000Z");
  const before = await reserveDailyQuota("research_fetch", 2, 0, beforeUtcMidnight);
  const after = await reserveDailyQuota("research_fetch", 2, 0, afterUtcMidnight);
  assertTest(
    tracker,
    "daily quota keys reset at UTC midnight",
    before.allowed && after.allowed && before.current === 1 && after.current === 1 &&
      before.resetsAt.toISOString() === "2036-10-31T00:00:00.000Z" &&
      after.resetsAt.toISOString() === "2036-11-01T00:00:00.000Z",
  );
}

async function testResearchQuotaAndFetchLock(tracker) {
  await AIResearchSource.init();
  const busySource = await AIResearchSource.create({
    name: "Locked integration source",
    url: `https://locked-${new mongoose.Types.ObjectId()}.example/feed`,
    publisher: "Integration",
    active: true,
    approvalStatus: "approved",
    fetchLockId: "another-job",
    fetchLockUntil: new Date(Date.now() + 60_000),
  });
  const locked = await syncResearchSource(busySource._id.toString(), { dailyFetchLimit: 8 });
  const day = new Date().toISOString().slice(0, 10);
  const quotaAfterLockedAttempt = await AIRateLimit.findOne({
    key: `daily:research_fetch:${day}`,
  }).lean();
  assertTest(
    tracker,
    "a source already locked by another job does not consume quota",
    Boolean(locked.error) && !quotaAfterLockedAttempt,
  );

  const attemptSource = await AIResearchSource.create({
    name: "Attempt accounting integration source",
    url: "https://127.0.0.1/feed.xml",
    publisher: "Integration",
    active: true,
    approvalStatus: "approved",
  });
  const attempted = await syncResearchSource(attemptSource._id.toString(), {
    dailyFetchLimit: 8,
  });
  const afterAttempt = await AIRateLimit.findOne({
    key: `daily:research_fetch:${day}`,
  }).lean();
  const unlocked = await AIResearchSource.findById(attemptSource._id).lean();
  assertTest(
    tracker,
    "a quota unit is consumed after acquiring the source lock even when a fetch attempt fails",
    Boolean(attempted.error) && afterAttempt?.count === 1 &&
      !unlocked.fetchLockId && !unlocked.fetchLockUntil,
  );

  const sharedSources = await AIResearchSource.insertMany(
    Array.from({ length: 24 }, (_, index) => ({
      name: `Concurrent manual/cron source ${index}`,
      url: `https://127.0.0.1/${index}/feed.xml`,
      publisher: "Integration",
      active: true,
      approvalStatus: "approved",
    })),
  );
  const concurrent = await Promise.all(
    sharedSources.map((source, index) =>
      syncResearchSource(source._id.toString(), { dailyFetchLimit: 8 })
        .then((result) => ({ caller: index % 2 === 0 ? "manual" : "cron", result })),
    ),
  );
  const successfulReservations = concurrent.filter(({ result }) => !result.quotaReached);
  const rejectedReservations = concurrent.filter(({ result }) => result.quotaReached);
  const researchCounter = await AIRateLimit.findOne({
    key: `daily:research_fetch:${day}`,
  }).lean();
  assertTest(
    tracker,
    "concurrent manual and cron production sync calls share the exact research quota",
    successfulReservations.length === 7 && rejectedReservations.length === 17 &&
      new Set(concurrent.map(({ caller }) => caller)).size === 2 &&
      researchCounter?.count === 8,
  );
  const exhausted = await reserveDailyResearchFetch(8);
  assertTest(
    tracker,
    "research reservations after exhaustion do not increment the stored count",
    !exhausted.allowed && exhausted.current === 8,
  );
}

async function testDuplicateInitialization(tracker) {
  await AIRateLimit.init();
  const key = `integration-duplicate-${new mongoose.Types.ObjectId()}`;
  await AIRateLimit.create({ key, count: 1, resetAt: new Date(Date.now() + 60_000) });
  let duplicateKeyRejected = false;
  try {
    await AIRateLimit.create({ key, count: 1, resetAt: new Date(Date.now() + 60_000) });
  } catch (error) {
    duplicateKeyRejected = error.code === 11000;
  }
  assertTest(
    tracker,
    "the MongoDB unique index rejects duplicate limiter initialization records",
    duplicateKeyRejected,
  );
}

async function testConversionLeaseOwnership(tracker) {
  await AIContentOpportunity.init();
  const opportunity = await AIContentOpportunity.create({
    proposedTitle: "Lease ownership integration",
    whyItMattersNow: "Verify MongoDB job fencing.",
    status: "new",
  });
  const jobA = await claimConversionJob(opportunity._id.toString());
  const jobAId = jobA?.jobId;
  assertTest(tracker, "Job A receives a unique conversion job ID", Boolean(jobAId));

  await AIContentOpportunity.updateOne(
    { _id: opportunity._id, status: "converting", jobId: jobAId },
    { $set: { conversionLeaseUntil: new Date(Date.now() - 1) } },
  );
  const jobB = await claimConversionJob(opportunity._id.toString());
  assertTest(
    tracker,
    "Job B recovers the expired lease with a different job ID",
    Boolean(jobB) && jobB.jobId !== jobAId,
  );

  const renewed = await renewConversionLease(opportunity._id.toString(), jobB.jobId);
  const staleFailure = await failConversionJob(
    opportunity._id.toString(),
    jobAId,
    "late Job A failure",
  );
  const persisted = await AIContentOpportunity.findById(opportunity._id).lean();
  assertTest(
    tracker,
    "Job B can renew its lease after recovery",
    renewed && persisted.conversionLeaseUntil > new Date(),
  );
  assertTest(
    tracker,
    "Job A's late failure cannot overwrite Job B's MongoDB state",
    !staleFailure && persisted.status === "converting" && persisted.jobId === jobB.jobId,
  );
}

async function testOpportunityPostIndex(tracker) {
  await Post.init();
  const opportunityId = new mongoose.Types.ObjectId();
  const basePost = {
    title: "Index ownership test",
    excerpt: "Test post",
    content: "<p>Test</p>",
    category: new mongoose.Types.ObjectId(),
    author: new mongoose.Types.ObjectId(),
    image: "https://example.test/image.png",
    readTime: "1 min read",
    status: "draft",
    aiOpportunityId: opportunityId,
  };
  const firstPost = await Post.create({ ...basePost, slug: `index-test-${new mongoose.Types.ObjectId()}` });
  const opportunity = await AIContentOpportunity.create({
    proposedTitle: "Recover existing post",
    whyItMattersNow: "The post must not be generated twice.",
    status: "new",
  });
  await Post.updateOne({ _id: firstPost._id }, { $set: { aiOpportunityId: opportunity._id } });
  const found = await Post.findOne({ aiOpportunityId: opportunity._id });
  const recovered = await recoverConversionPost(opportunity._id.toString(), found._id);
  const recoveredOpportunity = await AIContentOpportunity.findById(opportunity._id).lean();

  let duplicateRejected = false;
  try {
    await Post.create({
      ...basePost,
      aiOpportunityId: opportunity._id,
      slug: `index-test-${new mongoose.Types.ObjectId()}`,
    });
  } catch (error) {
    duplicateRejected = error.code === 11000;
  }
  assertTest(
    tracker,
    "conversion recovers the existing post through its aiOpportunityId lookup",
    Boolean(found) && recovered && recoveredOpportunity.status === "draft_ready",
  );
  assertTest(
    tracker,
    "the MongoDB unique aiOpportunityId index prevents duplicate generated posts",
    duplicateRejected,
  );
}

async function testOutageFailsClosed(tracker) {
  const outageUri = "mongodb://127.0.0.1:1/test_unavailable?serverSelectionTimeoutMS=300";
  execFileSync(
    process.execPath,
    [
      path.resolve("node_modules/tsx/dist/cli.mjs"),
      path.resolve("tests/ai-studio/quota-outage.integration.ts"),
    ],
    {
      env: { ...process.env, MONGODB_URI: outageUri },
      stdio: "pipe",
      timeout: 15_000,
    },
  );
  assertTest(
    tracker,
    "production rate-limit and daily-reservation functions fail closed on a real unreachable MongoDB endpoint",
    true,
  );
}

async function runTests(testTracker) {
  console.log("\n--- Suite 9: Real MongoDB Quota and Job-Lease Integration ---");
  await dbConnect();
  await AIRateLimit.init();
  await testDistributedLimiter(testTracker);
  await testDailyQuotaReservations(testTracker);
  await testResearchQuotaAndFetchLock(testTracker);
  await testDuplicateInitialization(testTracker);
  await testConversionLeaseOwnership(testTracker);
  await testOpportunityPostIndex(testTracker);
  await testOutageFailsClosed(testTracker);
}

module.exports = { runTests };
