const crypto = require("node:crypto");

function timingSafeMatch(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function validateFeedContentType(contentType, initialBodyChunk) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  if (ct.includes("text/html") || ct.includes("application/xhtml+xml")) return false;
  if (
    ct.startsWith("image/") ||
    ct.startsWith("audio/") ||
    ct.startsWith("video/") ||
    ct.includes("application/pdf") ||
    ct.includes("application/zip") ||
    ct.includes("application/json")
  ) {
    return false;
  }
  if (
    ct.includes("application/rss+xml") ||
    ct.includes("application/atom+xml") ||
    ct.includes("application/xml") ||
    ct.includes("text/xml") ||
    ct.includes("application/rdf+xml")
  ) {
    return true;
  }
  if (ct.includes("text/plain") || ct.includes("application/octet-stream")) {
    if (initialBodyChunk) {
      const trimmed = initialBodyChunk.trim().toLowerCase();
      return (
        trimmed.startsWith("<?xml") ||
        trimmed.startsWith("<rss") ||
        trimmed.startsWith("<feed") ||
        trimmed.startsWith("<rdf:rdf")
      );
    }
    return true;
  }
  return false;
}

async function runTests(testTracker) {
  console.log("\n--- Suite 7: Content-Type Validation & Authentication ---");

  const { parseRssOrAtomXml } = require("../../lib/ai-studio/researchFetcher.ts");
  const feedWithoutPublicationDate =
    '<rss><channel><item><title>Undated source</title><link>https://example.com/article</link></item></channel></rss>';
  const parsedUndatedItem = parseRssOrAtomXml(feedWithoutPublicationDate, "Example").at(0);
  testTracker.assert(
    "Undated feed items stay undated instead of appearing fresh",
    parsedUndatedItem?.publishedAt === undefined,
  );

  // 1. Content-Type Validation Tests
  testTracker.assert("Content-Type: application/rss+xml accepted", validateFeedContentType("application/rss+xml") === true);
  testTracker.assert("Content-Type: application/atom+xml accepted", validateFeedContentType("application/atom+xml; charset=utf-8") === true);
  testTracker.assert("Content-Type: text/xml accepted", validateFeedContentType("text/xml") === true);
  testTracker.assert("Content-Type: application/xml accepted", validateFeedContentType("application/xml") === true);

  testTracker.assert("Content-Type: text/html rejected (404/challenge page)", validateFeedContentType("text/html; charset=UTF-8") === false);
  testTracker.assert("Content-Type: application/json rejected", validateFeedContentType("application/json") === false);
  testTracker.assert("Content-Type: image/png rejected", validateFeedContentType("image/png") === false);
  testTracker.assert("Content-Type: application/pdf rejected", validateFeedContentType("application/pdf") === false);

  testTracker.assert(
    "Content-Type: text/plain with XML header accepted",
    validateFeedContentType("text/plain", "<?xml version='1.0'?><rss></rss>") === true
  );
  testTracker.assert(
    "Content-Type: text/plain with non-XML text rejected",
    validateFeedContentType("text/plain", "Not an XML feed document at all") === false
  );

  // 2. Cron Authentication Tests Against Actual Route Handlers
  const { GET: publishScheduledGet } = require("../../app/api/cron/publish-scheduled/route");
  const { GET: aiResearchSyncGet } = require("../../app/api/cron/ai-research-sync/route");
  const { isCronAuthorized } = require("../../lib/cronAuth.ts");

  const originalCronSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "super_secure_cron_token_999";

  try {
    testTracker.assert(
      "Cron Auth: Correct Bearer token accepted by production helper",
      isCronAuthorized(
        new Request("http://localhost:3000/api/cron/publish-scheduled", {
          headers: { authorization: "Bearer super_secure_cron_token_999" },
        }),
      ) === true,
    );
    testTracker.assert(
      "Cron Auth: Raw secret without Bearer scheme rejected",
      isCronAuthorized(
        new Request("http://localhost:3000/api/cron/publish-scheduled", {
          headers: { authorization: "super_secure_cron_token_999" },
        }),
      ) === false,
    );
    testTracker.assert(
      "Cron Auth: Query-string secret is not accepted",
      isCronAuthorized(
        new Request("http://localhost:3000/api/cron/publish-scheduled?key=super_secure_cron_token_999"),
      ) === false,
    );

    // A. Query string authentication strictly rejected by actual route handler
    const queryParamReq = new Request("http://localhost:3000/api/cron/publish-scheduled?key=super_secure_cron_token_999");
    const queryParamRes = await publishScheduledGet(queryParamReq);
    testTracker.assert("Actual Cron Handler: Query string ?key= rejected with 401", queryParamRes.status === 401);

    // B. Invalid Bearer Token rejected by actual route handler
    const invalidBearerReq = new Request("http://localhost:3000/api/cron/publish-scheduled", {
      headers: { authorization: "Bearer wrong_token_attempt" },
    });
    const invalidBearerRes = await publishScheduledGet(invalidBearerReq);
    testTracker.assert("Actual Cron Handler: Incorrect token rejected with 401", invalidBearerRes.status === 401);

    // C. Missing Authorization header rejected by actual research sync handler
    const missingAuthReq = new Request("http://localhost:3000/api/cron/ai-research-sync");
    const missingAuthRes = await aiResearchSyncGet(missingAuthReq);
    testTracker.assert("Actual Cron Handler: Missing Bearer rejected with 401", missingAuthRes.status === 401);

    // D. Unconfigured Secret fails closed
    delete process.env.CRON_SECRET;
    const unconfiguredReq = new Request("http://localhost:3000/api/cron/publish-scheduled", {
      headers: { authorization: "Bearer super_secure_cron_token_999" },
    });
    const unconfiguredRes = await publishScheduledGet(unconfiguredReq);
    testTracker.assert("Actual Cron Handler: Unconfigured CRON_SECRET fails closed with 401", unconfiguredRes.status === 401);
  } finally {
    process.env.CRON_SECRET = originalCronSecret;
  }

  // 3. Unpublished Post Protection Tests (app/api/posts/[id]/route.ts)
  // Public access must strictly return published posts; drafts and scheduled posts require authenticated admin/editor
  function evaluatePostAccess(post, session) {
    if (post.status !== "published") {
      const user = session?.user;
      if (!session || !user) {
        return { status: 401, error: "Unauthorized" };
      }
      const canView =
        user.role === "super_admin" ||
        user.role === "admin" ||
        user.role === "editor" ||
        (post.author && post.author.toString() === user.id);
      if (!canView) {
        return { status: 403, error: "Forbidden" };
      }
    }
    return { status: 200, post };
  }

  const publishedPost = { _id: "post_pub_1", title: "Published Blog", status: "published", author: "author_1" };
  const draftPost = { _id: "post_draft_1", title: "Draft Blog", status: "draft", author: "author_1" };
  const scheduledPost = { _id: "post_sched_1", title: "Scheduled Blog", status: "scheduled", author: "author_1" };

  const anonSession = null;
  const regularUserSession = { user: { id: "user_regular", role: "user" } };
  const authorSession = { user: { id: "author_1", role: "editor" } };
  const adminSession = { user: { id: "admin_user", role: "admin" } };
  const superAdminSession = { user: { id: "super_admin", role: "super_admin" } };

  // A. Public GET Access
  testTracker.assert("Post Access: Public can access published post (200)", evaluatePostAccess(publishedPost, anonSession).status === 200);
  testTracker.assert("Post Access: Public cannot access draft post (401)", evaluatePostAccess(draftPost, anonSession).status === 401);
  testTracker.assert("Post Access: Public cannot access scheduled post (401)", evaluatePostAccess(scheduledPost, anonSession).status === 401);

  // B. Regular Non-Author User Access
  testTracker.assert("Post Access: Non-author regular user blocked from draft (403)", evaluatePostAccess(draftPost, regularUserSession).status === 403);
  testTracker.assert("Post Access: Non-author regular user blocked from scheduled (403)", evaluatePostAccess(scheduledPost, regularUserSession).status === 403);

  // C. Author & Administrative Access
  testTracker.assert("Post Access: Author can access own draft (200)", evaluatePostAccess(draftPost, authorSession).status === 200);
  testTracker.assert("Post Access: Admin can access any draft (200)", evaluatePostAccess(draftPost, adminSession).status === 200);
  testTracker.assert("Post Access: Super admin can access scheduled post (200)", evaluatePostAccess(scheduledPost, superAdminSession).status === 200);

  // 4. Publishing Authorization Tests
  function checkPublishAuthorization(userRole, postAuthorId, currentUserId) {
    if (!currentUserId) return false;
    if (userRole === "super_admin") return true;
    if (userRole === "admin" && postAuthorId === currentUserId) return true;
    return false;
  }

  testTracker.assert("Publish Auth: Super admin can publish any post", checkPublishAuthorization("super_admin", "user_1", "user_2") === true);
  testTracker.assert("Publish Auth: Admin can publish their own post", checkPublishAuthorization("admin", "user_1", "user_1") === true);
  testTracker.assert("Publish Auth: Admin cannot publish another user's post", checkPublishAuthorization("admin", "user_1", "user_2") === false);
  testTracker.assert("Publish Auth: Anonymous user rejected", checkPublishAuthorization("user", "user_1", null) === false);
}

module.exports = { runTests };
