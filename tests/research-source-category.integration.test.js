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
mongoUrl.pathname = `/research_source_category_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "next-auth") {
    return {
      ...originalLoad.call(this, request, parent, isMain),
      getServerSession: async () => ({ user: { id: "test-admin", role: "admin" } }),
    };
  }
  if (request === "@/app/api/auth/[...nextauth]/route") {
    return { authOptions: {} };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const mongoose = require("mongoose");
const AIResearchSource = require("../models/AIResearchSource").default;
const { PATCH } = require("../app/api/admin/ai-studio/research/sources/[id]/route");

function patchRequest(category) {
  return new Request("http://localhost/api/admin/ai-studio/research/sources/test", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const source = await AIResearchSource.create({
      name: "Category clear test",
      url: "https://example.test/feed.xml",
      publisher: "Integration test",
      category: new mongoose.Types.ObjectId(),
    });
    const categoryId = new mongoose.Types.ObjectId();

    const assignResponse = await PATCH(
      patchRequest(categoryId.toString()),
      { params: Promise.resolve({ id: source.id }) },
    );
    assert.equal(assignResponse.status, 200);
    assert.equal((await AIResearchSource.findById(source.id)).category.toString(), categoryId.toString());

    const clearResponse = await PATCH(
      patchRequest(null),
      { params: Promise.resolve({ id: source.id }) },
    );
    assert.equal(clearResponse.status, 200);
    const cleared = await AIResearchSource.findById(source.id).lean();
    assert.equal(cleared.category, undefined);
    console.log("Research source category integration test passed (4 assertions).");
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
