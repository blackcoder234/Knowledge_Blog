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
mongoUrl.pathname = `/user_email_integrity_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();

const mongoose = require("mongoose");
const User = require("../models/User").default;
const {
  findSingleUserByEmail,
  findUserEmailMatches,
  normalizeUserEmail,
  AmbiguousUserEmailError,
} = require("../lib/userEmail");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    assert.equal(normalizeUserEmail("  Amarnath@Example.com "), "amarnath@example.com");
    const created = await User.create({
      name: "Normalized",
      email: "  MixedCase@Example.com ",
      password: "hashed",
    });
    assert.equal(created.email, "mixedcase@example.com");
    assert.equal(
      (await findSingleUserByEmail("MIXEDCASE@example.com")).id,
      created.id,
    );

    await User.collection.insertMany([
      {
        name: "Legacy mixed-case A",
        email: "Legacy@example.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Legacy mixed-case B",
        email: "legacy@EXAMPLE.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Legacy padded email",
        email: "  padded@example.com  ",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    assert.equal((await findUserEmailMatches("LEGACY@example.com")).length, 2);
    await assert.rejects(
      findSingleUserByEmail("legacy@example.com"),
      AmbiguousUserEmailError,
    );
    assert.equal(
      (await findSingleUserByEmail("padded@example.com")).email,
      "  padded@example.com  ",
    );
    console.log("User email integrity tests passed (6 assertions).");
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
