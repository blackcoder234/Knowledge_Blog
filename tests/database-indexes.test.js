const assert = require("node:assert/strict");
const Comment = require("../models/Comment").default;
const Post = require("../models/Post").default;

function hasIndex(model, expected) {
  return model.schema.indexes().some(([fields]) =>
    JSON.stringify(fields) === JSON.stringify(expected),
  );
}

assert.equal(
  hasIndex(Comment, { post: 1, status: 1, createdAt: -1 }),
  true,
  "comments have a compound index for post/status/date queries",
);
assert.equal(
  hasIndex(Post, { status: 1, createdAt: -1 }),
  true,
  "posts have a compound index for status/date queries",
);
assert.equal(
  hasIndex(Post, { category: 1, status: 1, createdAt: -1 }),
  true,
  "posts have a compound index for category/status/date queries",
);

console.log("Database index definitions passed (3 assertions).");
