import mongoose from "mongoose";
import User from "../models/User";

const INDEX_NAME = "email_unique_case_insensitive";
const MONGODB_URI = process.env.MONGODB_URI;
const apply = process.argv.includes("--apply");
const EMAIL_COLLATION = { locale: "en", strength: 2 } as const;

function isCaseInsensitiveUniqueEmailIndex(index: mongoose.mongo.IndexDescription) {
  const keys: Record<string, unknown> =
    index.key instanceof Map
      ? Object.fromEntries(index.key)
      : (index.key as Record<string, unknown>);
  return (
    keys?.email === 1 &&
    Object.keys(keys).length === 1 &&
    index.unique === true &&
    index.collation?.locale === EMAIL_COLLATION.locale &&
    index.collation?.strength === EMAIL_COLLATION.strength
  );
}

async function findConflicts() {
  return User.collection
    .aggregate<{
      _id: string;
      count: number;
      userIds: mongoose.Types.ObjectId[];
    }>([
      { $match: { email: { $type: "string" } } },
      {
        $project: {
          normalizedEmail: {
            $toLower: { $trim: { input: "$email" } },
          },
        },
      },
      {
        $group: {
          _id: "$normalizedEmail",
          count: { $sum: 1 },
          userIds: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 100 },
    ])
    .toArray();
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Set MONGODB_URI to the intended database before running this migration.");
  }

  await mongoose.connect(MONGODB_URI, { autoIndex: false });

  const collectionExists = await mongoose.connection.db
    ?.listCollections({ name: User.collection.name }, { nameOnly: true })
    .hasNext();
  if (!collectionExists) {
    if (!apply) {
      console.log("The users collection does not exist yet; there are no email values to inspect.");
      return;
    }
    await User.collection.createIndex(
      { email: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        collation: EMAIL_COLLATION,
      },
    );
    console.log(`Created and verified index "${INDEX_NAME}" for the empty users collection.`);
    return;
  }

  const invalidRecords = await User.collection
    .find({
      $or: [
        { email: { $exists: false } },
        { email: { $not: { $type: "string" } } },
        { email: { $type: "string", $regex: /^\s*$/ } },
      ],
    })
    .project({ _id: 1, email: 1 })
    .limit(100)
    .toArray();
  if (invalidRecords.length > 0) {
    console.error("Users with missing or empty email values must be resolved manually:");
    for (const record of invalidRecords) console.error(String(record._id));
    process.exitCode = 1;
    return;
  }

  const conflicts = await findConflicts();
  if (conflicts.length > 0) {
    console.error("Case-insensitive duplicate email groups must be resolved manually:");
    for (const conflict of conflicts) {
      console.error(`${conflict._id}: ${conflict.count} users (${conflict.userIds.join(", ")})`);
    }
    console.error("No records or indexes were modified.");
    process.exitCode = 1;
    return;
  }

  const indexes = await User.collection.indexes();
  const emailIndexes = indexes.filter((index) => index.key?.email === 1);
  const existing = emailIndexes.find(isCaseInsensitiveUniqueEmailIndex);

  const namedIndex = indexes.find((index) => index.name === INDEX_NAME);
  if (namedIndex && !isCaseInsensitiveUniqueEmailIndex(namedIndex)) {
    throw new Error(
      `Index "${INDEX_NAME}" exists with a different definition. Review it manually; this script will not replace indexes.`,
    );
  }

  if (!apply) {
    if (existing) {
      console.log(`Verified existing index "${existing.name}". No records were modified.`);
    } else {
      console.log(
        `No duplicate or invalid email records found. Re-run with --apply to normalize emails and create "${INDEX_NAME}".`,
      );
    }
    return;
  }

  if (!existing) {
    await User.collection.createIndex(
      { email: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        collation: EMAIL_COLLATION,
      },
    );
  }
  await User.collection.updateMany(
    { email: { $type: "string" } },
    [{ $set: { email: { $toLower: { $trim: { input: "$email" } } } } }],
  );

  const migratedConflicts = await findConflicts();
  const updatedIndexes = await User.collection.indexes();
  const created = updatedIndexes.find(isCaseInsensitiveUniqueEmailIndex);
  if (migratedConflicts.length > 0 || !created) {
    throw new Error("Email normalization/index verification failed; inspect the database before further changes.");
  }
  console.log(`Normalized user emails and created/verified index "${created.name}".`);
}

main()
  .catch((error) => {
    console.error("User email migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
