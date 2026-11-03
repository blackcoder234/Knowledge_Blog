const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");

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
mongoUrl.pathname = `/user_email_migration_test_${process.pid}_${Date.now()}`;
const isolatedMongoUri = mongoUrl.toString();
process.env.MONGODB_URI = isolatedMongoUri;

const mongoose = require("mongoose");
const User = require("../models/User").default;

function runMigration(apply) {
  try {
    return {
      status: 0,
      output: execFileSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "scripts/migrate-user-email-index.ts",
          ...(apply ? ["--apply"] : []),
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, MONGODB_URI: isolatedMongoUri },
          encoding: "utf8",
          stdio: "pipe",
        },
      ),
    };
  } catch (error) {
    return {
      status: error.status,
      output: `${error.stdout || ""}${error.stderr || ""}`,
    };
  }
}

async function run() {
  try {
    await mongoose.connect(isolatedMongoUri);
    await User.collection.insertMany([
      {
        name: "Migration duplicate A",
        email: "Migration@example.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Migration duplicate B",
        email: "migration@EXAMPLE.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const blocked = runMigration(true);
    assert.equal(blocked.status, 1);
    assert.match(blocked.output, /duplicate email groups/i);
    assert.deepEqual(
      (await User.collection.find({}).sort({ email: 1 }).toArray()).map((user) => user.email),
      ["Migration@example.com", "migration@EXAMPLE.com"],
    );
    assert.equal(
      (await User.collection.indexes()).some((index) => index.name === "email_unique_case_insensitive"),
      false,
    );

    await User.collection.deleteOne({ name: "Migration duplicate B" });
    const dryRun = runMigration(false);
    assert.equal(dryRun.status, 0, dryRun.output);
    assert.equal(
      (await User.collection.findOne({ name: "Migration duplicate A" })).email,
      "Migration@example.com",
    );

    const applied = runMigration(true);
    assert.equal(applied.status, 0, applied.output);
    assert.equal(
      (await User.collection.findOne({ name: "Migration duplicate A" })).email,
      "migration@example.com",
    );
    const index = (await User.collection.indexes()).find(
      (candidate) => candidate.name === "email_unique_case_insensitive",
    );
    assert.equal(index?.unique, true);
    assert.equal(index?.collation?.locale, "en");
    assert.equal(index?.collation?.strength, 2);

    const dryRerun = runMigration(false);
    assert.equal(dryRerun.status, 0, dryRerun.output);
    assert.match(dryRerun.output, /Verified existing index "email_unique_case_insensitive"/i);

    const appliedRerun = runMigration(true);
    assert.equal(appliedRerun.status, 0, appliedRerun.output);
    assert.match(appliedRerun.output, /created\/verified index "email_unique_case_insensitive"/i);

    // Verify that an index with the same name but wrong definition is still blocked
    await User.collection.dropIndex("email_unique_case_insensitive");
    await User.collection.createIndex({ email: 1 }, { name: "email_unique_case_insensitive" });
    const conflicting = runMigration(false);
    assert.equal(conflicting.status, 1);
    assert.match(conflicting.output, /exists with a different definition/i);

    console.log("User email migration tests passed (17 assertions).");
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
