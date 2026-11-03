import mongoose from "mongoose";
import Post from "../models/Post";

const INDEX_NAME = "aiOpportunityId_unique_partial";
const MONGODB_URI = process.env.MONGODB_URI;
const apply = process.argv.includes("--apply");
const EXPECTED_PARTIAL_FILTER = { aiOpportunityId: { $type: "objectId" } };

function isExpectedIndex(index: mongoose.mongo.IndexDescription) {
  const keys = Object.entries(index.key || {});
  return (
    keys.length === 1 &&
    keys[0][0] === "aiOpportunityId" &&
    keys[0][1] === 1 &&
    index.unique === true &&
    JSON.stringify(index.partialFilterExpression) === JSON.stringify(EXPECTED_PARTIAL_FILTER)
  );
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Set MONGODB_URI to the intended database before running this check.");
  }

  await mongoose.connect(MONGODB_URI, { autoIndex: false });

  const collectionExists = await mongoose.connection.db
    ?.listCollections({ name: Post.collection.name }, { nameOnly: true })
    .hasNext();
  if (!collectionExists) {
    console.log("The posts collection does not exist yet; there are no existing values to validate.");
  } else {
    const duplicates = await Post.aggregate([
      { $match: { aiOpportunityId: { $type: "objectId" } } },
      { $group: { _id: "$aiOpportunityId", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 50 },
    ]);

    if (duplicates.length > 0) {
      console.error("Duplicate aiOpportunityId values must be resolved before creating the unique index:");
      for (const duplicate of duplicates) {
        console.error(`${duplicate._id}: ${duplicate.count} posts`);
      }
      process.exitCode = 1;
      return;
    }

    const indexes = await Post.collection.indexes();
    const relatedIndexes = indexes.filter((index) => index.key?.aiOpportunityId === 1);
    const existing = relatedIndexes.find(isExpectedIndex);
    if (existing) {
      console.log(`Verified existing index "${existing.name}".`);
      return;
    }
    if (relatedIndexes.length > 0) {
      const conflicting = relatedIndexes[0];
      throw new Error(
        `Conflicting index "${conflicting.name}" exists on aiOpportunityId. Review it manually; this script will not drop or replace indexes.`,
      );
    }
  }

  if (!apply) {
    console.log(
      `No duplicate aiOpportunityId values found. Re-run with --apply to create "${INDEX_NAME}".`,
    );
    return;
  }

  await Post.collection.createIndex(
    { aiOpportunityId: 1 },
    {
      name: INDEX_NAME,
      unique: true,
      partialFilterExpression: EXPECTED_PARTIAL_FILTER,
    },
  );
  const createdIndexes = await Post.collection.indexes();
  const created = createdIndexes.find((index) => index.name === INDEX_NAME);
  if (!created || !isExpectedIndex(created)) {
    throw new Error(`Index "${INDEX_NAME}" was created but does not match the expected definition.`);
  }
  console.log(`Created and verified index "${created.name}".`);
}

main()
  .catch((error) => {
    console.error("AI opportunity index verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
