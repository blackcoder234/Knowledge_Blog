// Tests may only connect to a local database explicitly named for testing.
const testMongoUri =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/test_knowledgelog";
const testMongoUrl = new URL(testMongoUri);
const testDatabase = testMongoUrl.pathname.replace(/^\//, "");
if (
  !["localhost", "127.0.0.1", "::1", "[::1]"].includes(testMongoUrl.hostname) ||
  !/test/i.test(testDatabase)
) {
  throw new Error("Tests require a local MongoDB URI with a database name containing 'test'.");
}
testMongoUrl.pathname = `/knowledgelog_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = testMongoUrl.toString();
if (!process.env.CRON_SECRET) {
  process.env.CRON_SECRET = "super_secure_cron_token_999";
}

const suite1 = require("./dns-pinning-rebinding.test.js");
const suite2 = require("./body-timeout-and-size.test.js");
const suite3 = require("./concurrent-generation-idempotency.test.js");
const suite4 = require("./scheduled-publishing-atomicity.test.js");
const suite5 = require("./distributed-rate-limiter.test.js");
const suite6 = require("./provider-failover.test.js");
const suite7 = require("./content-type-and-auth.test.js");
const suite8 = require("./content-sanitization.test.js");
const suite9 = require("./mongodb-integration.test.js");
const mongoose = require("mongoose");

class TestTracker {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testIndex = 0;
    this.failures = [];
  }

  assert(description, condition) {
    this.testIndex++;
    if (condition) {
      this.passed++;
      console.log(`[PASS #${this.testIndex}] ${description}`);
    } else {
      this.failed++;
      this.failures.push({ index: this.testIndex, description });
      console.error(`[FAIL #${this.testIndex}] ${description}`);
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log("\n==========================================");
    console.log("KNOWLEDGLOG AI STUDIO TEST SUITE SUMMARY");
    console.log("==========================================");
    console.log(`Total Assertions Evaluated: ${total}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log("==========================================");

    if (this.failed > 0) {
      console.error("\nFAILURES ENCOUNTERED:");
      this.failures.forEach((f) => {
        console.error(` - Test #${f.index}: ${f.description}`);
      });
      process.exitCode = 1;
    } else {
      console.log("\nAll evaluated test assertions passed.");
      process.exitCode = 0;
    }
  }
}

async function runAll() {
  console.log("Starting KnowledgeLog AI Studio Comprehensive Test Runner...\n");
  const tracker = new TestTracker();

  try {
    await suite1.runTests(tracker);
    await suite2.runTests(tracker);
    await suite3.runTests(tracker);
    await suite4.runTests(tracker);
    await suite5.runTests(tracker);
    await suite6.runTests(tracker);
    await suite7.runTests(tracker);
    await suite8.runTests(tracker);
    await suite9.runTests(tracker);
  } catch (err) {
    console.error("\nUnexpected unhandled error during test suite execution:", err);
    process.exitCode = 1;
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
      }
      await mongoose.disconnect();
    } catch (error) {
      console.error("Could not clean up isolated MongoDB test database:", error);
      process.exitCode = 1;
    }
  }

  tracker.summary();
}

runAll();
