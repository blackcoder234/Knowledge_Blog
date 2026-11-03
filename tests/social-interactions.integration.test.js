const assert = require("node:assert/strict");
const Module = require("node:module");

const mongoUri =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/test_knowledgelog";
const mongoUrl = new URL(mongoUri);
const databaseName = mongoUrl.pathname.replace(/^\//, "");
if (
  !["localhost", "127.0.0.1", "::1", "[::1]"].includes(mongoUrl.hostname) ||
  !/test/i.test(databaseName)
) {
  throw new Error("Tests require a local MongoDB URI with a database name containing 'test'.");
}
mongoUrl.pathname = `/social_interactions_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();
process.env.NEXTAUTH_SECRET = "local-social-interactions-test-secret";

let activeSession = null;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "next-auth") {
    return {
      ...originalLoad.call(this, request, parent, isMain),
      getServerSession: async () => activeSession,
    };
  }
  if (request === "@/app/api/auth/[...nextauth]/route") {
    return { authOptions: {} };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const mongoose = require("mongoose");
const dbConnect = require("../lib/db").default;
const User = require("../models/User").default;
const Post = require("../models/Post").default;
const GuestPostLike = require("../models/GuestPostLike").default;
const { POST: toggleLike } = require("../app/api/posts/[id]/like/route");
const { POST: toggleBookmark } = require("../app/api/posts/[id]/bookmark/route");
const { GET: getInteractions } = require("../app/api/user/interactions/route");
const Visitor = require("../models/Visitor").default;
const PageView = require("../models/PageView").default;
const { POST: trackVisit } = require("../app/api/track/route");

let assertionCount = 0;
let skippedTransactionChecks = 0;
function check(condition, message) {
  assertionCount++;
  assert.ok(condition, message);
}

function routeParams(id) {
  return { params: Promise.resolve({ id }) };
}

function request(url, body, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function createPost(author, status = "published") {
  return Post.create({
    title: `Interaction ${status}`,
    slug: `interaction-${status}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    excerpt: "Test excerpt",
    content: "<p>Test content</p>",
    category: new mongoose.Types.ObjectId(),
    image: "https://example.com/image.jpg",
    author,
    readTime: "1 min read",
    status,
  });
}

async function testAuthenticatedLikesAreIdempotentAndPublishedOnly(user, post, draft) {
  activeSession = { user: { id: user.id, role: "user" } };
  const likeRequest = () => request("http://localhost/api/posts/like", { action: "like" });
  const unlikeRequest = () => request("http://localhost/api/posts/like", { action: "unlike" });

  let response = await toggleLike(likeRequest(), routeParams(post.id));
  check(response.status === 200, "authenticated like succeeds");
  check((await response.json()).likes === 1, "first like increments the MongoDB count");

  response = await toggleLike(likeRequest(), routeParams(post.id));
  check((await response.json()).likes === 1, "repeated like does not double-count");

  response = await toggleLike(unlikeRequest(), routeParams(post.id));
  check((await response.json()).likes === 0, "unlike decrements the MongoDB count");
  response = await toggleLike(unlikeRequest(), routeParams(post.id));
  check((await response.json()).likes === 0, "repeated unlike does not decrement below zero");

  response = await toggleLike(likeRequest(), routeParams(draft.id));
  check(response.status === 404, "draft post cannot be liked");
  const storedUser = await User.findById(user.id).select("likedPosts");
  check(storedUser.likedPosts.length === 0, "MongoDB user state matches completed unlikes");
}

async function testGuestLikesUseSignedIdentity(user, post) {
  activeSession = null;
  const firstResponse = await toggleLike(
    request("http://localhost/api/posts/like", { action: "like" }),
    routeParams(post.id),
  );
  check(firstResponse.status === 200, "guest like succeeds");
  const setCookie = firstResponse.headers.get("set-cookie");
  check(Boolean(setCookie), "guest receives signed HttpOnly identity cookie");
  const cookie = setCookie.split(";")[0];

  const repeated = await toggleLike(
    request("http://localhost/api/posts/like", { action: "like" }, cookie),
    routeParams(post.id),
  );
  check((await repeated.json()).likes === 1, "repeated guest like is idempotent");
  check(await GuestPostLike.countDocuments({ postId: post._id }) === 1, "guest like has one MongoDB record");

  const unlike = await toggleLike(
    request("http://localhost/api/posts/like", { action: "unlike" }, cookie),
    routeParams(post.id),
  );
  check((await unlike.json()).likes === 0, "guest unlike removes the MongoDB record and count");
  check(await GuestPostLike.countDocuments({ postId: post._id }) === 0, "guest unlike removes the unique record");
}

async function testBookmarkAndInteractionReadsExcludeUnpublished(user, post, draft) {
  activeSession = { user: { id: user.id, role: "user" } };
  const bookmarkResponse = await toggleBookmark(
    new Request("http://localhost/api/posts/bookmark", { method: "POST" }),
    routeParams(post.id),
  );
  check(bookmarkResponse.status === 200, "published post can be bookmarked");
  check((await bookmarkResponse.json()).isBookmarked === true, "bookmark response reflects saved state");

  const draftResponse = await toggleBookmark(
    new Request("http://localhost/api/posts/bookmark", { method: "POST" }),
    routeParams(draft.id),
  );
  check(draftResponse.status === 404, "draft post cannot be bookmarked");

  const idsResponse = await getInteractions(
    new Request("http://localhost/api/user/interactions?type=ids"),
  );
  const ids = await idsResponse.json();
  check(ids.bookmarked.includes(post.id), "interaction IDs include published bookmark");
  check(!ids.bookmarked.includes(draft.id), "interaction IDs exclude drafts");

  const postsResponse = await getInteractions(
    new Request("http://localhost/api/user/interactions?type=bookmarks"),
  );
  const posts = await postsResponse.json();
  check(posts.length === 1 && posts[0]._id.toString() === post.id, "bookmark view exposes only published posts");
}

async function testTrackingStoresOnlyTrustedRequestIp() {
  const environment = process.env;
  const originalNodeEnv = environment.NODE_ENV;
  environment.NODE_ENV = "production";
  try {
    const response = await trackVisit(
      new Request("http://localhost/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Real-IP": "198.51.100.44",
          "X-Forwarded-For": "203.0.113.55",
        },
        body: JSON.stringify({
          path: "/ip-source-check",
          ip: "192.0.2.99",
        }),
      }),
    );
    check(response.status === 200, "tracking request is accepted");
    const visitor = await Visitor.findOne({ ip: "198.51.100.44", path: "/ip-source-check" });
    check(Boolean(visitor), "visitor record stores only the validated platform IP");
    check(
      (await Visitor.countDocuments({ ip: { $in: ["203.0.113.55", "192.0.2.99"] } })) === 0,
      "forwarded and body-supplied IP values are never stored as visitor IP",
    );
    const pageView = await PageView.findOne({ path: "/ip-source-check" });
    check(pageView?.ip === "198.51.100.44", "page view stores the platform-provided IP");
    check(Boolean(visitor?.visitorId), "tracking generates a server-side ID when none is supplied");
  } finally {
    if (originalNodeEnv === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = originalNodeEnv;
  }
}

async function run() {
  try {
    await dbConnect();
    const user = await User.create({
      name: "Social interaction test",
      email: `social-${Date.now()}@example.test`,
      password: "hashed-test-password",
    });
    const publishedPost = await createPost(user._id);
    const draftPost = await createPost(user._id, "draft");

    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (hello.setName || hello.msg === "isdbgrid") {
      await testAuthenticatedLikesAreIdempotentAndPublishedOnly(user, publishedPost, draftPost);
      await testGuestLikesUseSignedIdentity(user, publishedPost);
    } else {
      skippedTransactionChecks = 2;
      console.warn("Skipped authenticated and guest like integration checks: MongoDB is not a replica set; like updates require transactions.");
    }
    await testBookmarkAndInteractionReadsExcludeUnpublished(user, publishedPost, draftPost);
    await testTrackingStoresOnlyTrustedRequestIp();
    console.log(
      `Social interaction integration checks: ${assertionCount} passed, ${skippedTransactionChecks} skipped.`,
    );
  } finally {
    activeSession = null;
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
