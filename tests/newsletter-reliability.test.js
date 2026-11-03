const strictAssert = require("node:assert/strict");
let assertionCount = 0;
const assert = new Proxy(strictAssert, {
  get(target, property) {
    const value = Reflect.get(target, property);
    if (typeof value !== "function") return value;
    return (...args) => {
      assertionCount++;
      return value(...args);
    };
  },
});
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
mongoUrl.pathname = `/newsletter_reliability_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();
process.env.BUTTONDOWN_API_KEY = "test-provider-key";

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "next-auth") {
    return {
      ...originalLoad.call(this, request, parent, isMain),
      getServerSession: async () => ({ user: { role: "super_admin" } }),
    };
  }
  if (request === "@/app/api/auth/[...nextauth]/route") {
    return { authOptions: {} };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const mongoose = require("mongoose");
const Newsletter = require("../models/Newsletter").default;
const dbConnect = require("../lib/db").default;
const { POST: sendNewsletter } = require("../app/api/admin/newsletter/[id]/send/route");
const {
  PATCH: updateNewsletter,
  DELETE: deleteNewsletter,
} = require("../app/api/admin/newsletter/[id]/route");

function routeParams(id) {
  return { params: Promise.resolve({ id }) };
}

function request(method, body) {
  return new Request("http://localhost/api/admin/newsletter/test", {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function createNewsletter(overrides = {}) {
  return Newsletter.create({
    subject: "Reliability test",
    content: "<p>Test body</p>",
    ...overrides,
  });
}

async function testConcurrentSendAndProtectedUpdates() {
  const newsletter = await createNewsletter();
  let fetchCount = 0;
  let signalFetchStarted;
  let releaseProvider;
  const fetchStarted = new Promise((resolve) => {
    signalFetchStarted = resolve;
  });
  const providerGate = new Promise((resolve) => {
    releaseProvider = resolve;
  });
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCount++;
    signalFetchStarted();
    await providerGate;
    return new Response(JSON.stringify({ id: "private-provider-id" }), {
      status: 200,
    });
  };

  try {
    const firstSend = sendNewsletter(request("POST"), routeParams(newsletter.id));
    await fetchStarted;

    const secondResponse = await sendNewsletter(
      request("POST"),
      routeParams(newsletter.id),
    );
    assert.equal(secondResponse.status, 409);

    const contentPatch = await updateNewsletter(
      request("PATCH", { content: "<p>Changed</p>" }),
      routeParams(newsletter.id),
    );
    assert.equal(contentPatch.status, 409);
    const deleteResponse = await deleteNewsletter(
      request("DELETE"),
      routeParams(newsletter.id),
    );
    assert.equal(deleteResponse.status, 409);
    assert.equal((await Newsletter.findById(newsletter.id)).content, "<p>Test body</p>");

    releaseProvider();
    const firstResponse = await firstSend;
    assert.equal(firstResponse.status, 200);
    assert.deepEqual(await firstResponse.json(), { success: true });
    const saved = await Newsletter.findById(newsletter.id);
    assert.equal(saved.status, "sent");
    assert.equal(saved.sendingAt, undefined);
    assert.equal(saved.providerId, "private-provider-id");
    assert.equal(fetchCount, 1);

    assert.equal(
      (
        await updateNewsletter(
          request("PATCH", { content: "after send" }),
          routeParams(newsletter.id),
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await updateNewsletter(
          request("PATCH", {
            reconcileSend: "provider_confirmed_not_sent",
          }),
          routeParams(newsletter.id),
        )
      ).status,
      409,
    );
    assert.equal(
      (await deleteNewsletter(request("DELETE"), routeParams(newsletter.id))).status,
      409,
    );
  } finally {
    releaseProvider();
    global.fetch = originalFetch;
  }
}

async function testDefinitiveRejectionReleasesClaim() {
  const newsletter = await createNewsletter();
  const originalFetch = global.fetch;
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount++;
    return new Response("private provider rejection details", { status: 400 });
  };

  try {
    const response = await sendNewsletter(
      request("POST"),
      routeParams(newsletter.id),
    );
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes("private provider"), false);
    const saved = await Newsletter.findById(newsletter.id);
    assert.equal(saved.status, "draft");
    assert.equal(saved.sendingAt, undefined);

    global.fetch = async () => {
      fetchCount++;
      return new Response(JSON.stringify({ id: "accepted" }), { status: 200 });
    };
    assert.equal(
      (
        await sendNewsletter(request("POST"), routeParams(newsletter.id))
      ).status,
      200,
    );
    assert.equal(fetchCount, 2);
  } finally {
    global.fetch = originalFetch;
  }
}

async function testAmbiguousProviderOutcomesStayClaimed() {
  for (const [label, providerResult] of [
    ["provider timeout response", async () => new Response("private details", { status: 408 })],
    ["server error", async () => new Response("private details", { status: 500 })],
    ["network error", async () => {
      throw new Error("private network details");
    }],
    ["request timeout", async () => {
      throw Object.assign(new Error("private timeout details"), {
        name: "AbortError",
      });
    }],
  ]) {
    const newsletter = await createNewsletter();
    const originalFetch = global.fetch;
    let fetchCount = 0;
    global.fetch = async () => {
      fetchCount++;
      return providerResult();
    };

    try {
      const response = await sendNewsletter(
        request("POST"),
        routeParams(newsletter.id),
      );
      assert.equal(response.status, 502, label);
      assert.equal((await response.text()).includes("private"), false, label);
      assert.equal((await Newsletter.findById(newsletter.id)).status, "sending", label);

      const retryResponse = await sendNewsletter(
        request("POST"),
        routeParams(newsletter.id),
      );
      assert.equal(retryResponse.status, 409, label);
      assert.equal(fetchCount, 1, label);
    } finally {
      global.fetch = originalFetch;
    }
  }
}

async function testStaleClaimRequiresManualReconciliation() {
  const newsletter = await createNewsletter({
    status: "sending",
    sendingAt: new Date(Date.now() - 60 * 60 * 1000),
  });
  const recent = await createNewsletter({
    status: "sending",
    sendingAt: new Date(),
  });
  const originalFetch = global.fetch;
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount++;
    return new Response(JSON.stringify({ id: "unexpected" }), { status: 200 });
  };

  try {
    const response = await sendNewsletter(
      request("POST"),
      routeParams(newsletter.id),
    );
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /manual reconciliation/i);
    assert.equal(fetchCount, 0);
    assert.equal((await Newsletter.findById(newsletter.id)).status, "sending");

    const recentRecovery = await updateNewsletter(
      request("PATCH", {
        reconcileSend: "provider_confirmed_not_sent",
      }),
      routeParams(recent.id),
    );
    assert.equal(recentRecovery.status, 409);
    assert.equal((await Newsletter.findById(recent.id)).status, "sending");

    const contentPatch = await updateNewsletter(
      request("PATCH", { content: "not allowed while stale" }),
      routeParams(newsletter.id),
    );
    assert.equal(contentPatch.status, 409);
    const deleteResponse = await deleteNewsletter(
      request("DELETE"),
      routeParams(newsletter.id),
    );
    assert.equal(deleteResponse.status, 409);

    const recovery = await updateNewsletter(
      request("PATCH", {
        reconcileSend: "provider_confirmed_not_sent",
      }),
      routeParams(newsletter.id),
    );
    assert.equal(recovery.status, 200);
    assert.equal((await Newsletter.findById(newsletter.id)).status, "draft");
    assert.equal((await Newsletter.findById(newsletter.id)).sendingAt, undefined);

    global.fetch = async () => {
      fetchCount++;
      return new Response(JSON.stringify({ id: "after-reconciliation" }), {
        status: 200,
      });
    };
    assert.equal(
      (
        await sendNewsletter(request("POST"), routeParams(newsletter.id))
      ).status,
      200,
    );
    assert.equal(fetchCount, 1);
    assert.equal((await Newsletter.findById(newsletter.id)).status, "sent");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testPatchAllowlistAndValidators() {
  const newsletter = await createNewsletter();
  const overpost = await updateNewsletter(
    request("PATCH", { content: "changed", status: "sent" }),
    routeParams(newsletter.id),
  );
  assert.equal(overpost.status, 400);
  assert.equal((await Newsletter.findById(newsletter.id)).status, "draft");

  const invalid = await updateNewsletter(
    request("PATCH", { subject: "" }),
    routeParams(newsletter.id),
  );
  assert.equal(invalid.status, 400);
}

async function run() {
  try {
    await dbConnect();
    await testConcurrentSendAndProtectedUpdates();
    await testDefinitiveRejectionReleasesClaim();
    await testAmbiguousProviderOutcomesStayClaimed();
    await testStaleClaimRequiresManualReconciliation();
    await testPatchAllowlistAndValidators();
    console.log(`Newsletter reliability tests passed (${assertionCount} assertions).`);
  } finally {
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
