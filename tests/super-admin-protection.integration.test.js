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
mongoUrl.pathname = `/super_admin_protection_test_${process.pid}_${Date.now()}`;
process.env.MONGODB_URI = mongoUrl.toString();

let activeSession;
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
const User = require("../models/User").default;
const dbConnect = require("../lib/db").default;
const { DELETE: deleteOwnAccount } = require("../app/api/user/delete/route");
const {
  DELETE: adminDeleteUser,
  PATCH: updateUserRole,
} = require("../app/api/users/[id]/route");

function routeParams(id) {
  return { params: Promise.resolve({ id }) };
}

async function createUser(name, role) {
  return User.create({
    name,
    email: `${name.toLowerCase().replace(/\s/g, "-")}-${Date.now()}-${Math.random()}@example.com`,
    role,
  });
}

async function run() {
  try {
    await dbConnect();

    const soleAdmin = await createUser("Sole Admin", "super_admin");
    activeSession = { user: { id: soleAdmin.id, role: "super_admin" } };
    const selfDeleteResponse = await deleteOwnAccount(
      new Request("http://localhost/api/user/delete", { method: "DELETE" }),
    );
    assert.equal(selfDeleteResponse.status, 400);
    assert.equal((await User.findById(soleAdmin.id))?.role, "super_admin");

    const selfDemotionResponse = await updateUserRole(
      new Request(`http://localhost/api/users/${soleAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user" }),
      }),
      routeParams(soleAdmin.id),
    );
    assert.equal(selfDemotionResponse.status, 400);
    assert.equal((await User.findById(soleAdmin.id))?.role, "super_admin");

    const secondAdmin = await createUser("Second Admin", "super_admin");
    const deleteLastAdminResponse = await adminDeleteUser(
      new Request(`http://localhost/api/users/${secondAdmin.id}`, {
        method: "DELETE",
      }),
      routeParams(secondAdmin.id),
    );
    assert.equal(deleteLastAdminResponse.status, 200);
    assert.equal(await User.countDocuments({ role: "super_admin" }), 1);

    const regularUser = await createUser("Regular User", "user");
    activeSession = { user: { id: regularUser.id, role: "user" } };
    const regularUserDeleteResponse = await deleteOwnAccount(
      new Request("http://localhost/api/user/delete", { method: "DELETE" }),
    );
    assert.equal(regularUserDeleteResponse.status, 200);
    assert.equal(await User.findById(regularUser.id), null);
    assert.equal(await User.countDocuments({ role: "super_admin" }), 1);

    console.log("Super Admin protection tests passed (9 assertions).");
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
