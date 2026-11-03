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
mongoUrl.pathname = `/post_id_validation_test_${process.pid}_${Date.now()}`;
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
  if (request === "next/cache") {
    return { revalidatePath: () => undefined };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { GET, DELETE, PATCH } = require("../app/api/posts/[id]/route");

function routeParams(id) {
  return { params: Promise.resolve({ id }) };
}

async function run() {
  const malformedIds = ["not-an-object-id", "123", "zzzzzzzzzzzzzzzzzzzzzzzz"];
  for (const id of malformedIds) {
    const getResponse = await GET(
      new Request(`http://localhost/api/posts/${id}`),
      routeParams(id),
    );
    assert.equal(getResponse.status, 400, `GET rejects malformed ID: ${id}`);

    const deleteResponse = await DELETE(
      new Request(`http://localhost/api/posts/${id}`, { method: "DELETE" }),
      routeParams(id),
    );
    assert.equal(deleteResponse.status, 400, `DELETE rejects malformed ID: ${id}`);

    const patchResponse = await PATCH(
      new Request(`http://localhost/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Not written" }),
      }),
      routeParams(id),
    );
    assert.equal(patchResponse.status, 400, `PATCH rejects malformed ID: ${id}`);
  }
  console.log("Post ID validation tests passed (9 assertions).");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
