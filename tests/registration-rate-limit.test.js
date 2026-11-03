const assert = require("node:assert/strict");

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
mongoUrl.pathname = `/reg_rate_limit_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();

const mongoose = require("mongoose");
const { POST } = require("../app/api/register/route");

async function run() {
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    process.env.NODE_ENV = "production";

    // 1. Missing trusted IP in production fails safely with 400
    const noIpReq = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10", // Untrusted in production
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "ValidPassword123!",
      }),
    });
    const noIpRes = await POST(noIpReq);
    assert.equal(noIpRes.status, 400);
    const noIpBody = await noIpRes.json();
    assert.match(noIpBody.error, /Unable to verify client connection/i);

    // 2. Valid platform-provided x-real-ip is accepted
    const validIpReq = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "203.0.113.50",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "unique_new_user@example.com",
        password: "ValidPassword123!",
      }),
    });
    const validIpRes = await POST(validIpReq);
    assert.equal(validIpRes.status, 201);

    console.log("Registration trusted-IP and rate-limit tests passed (3 assertions).");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Registration rate limit test failed:", error);
  process.exitCode = 1;
});

