import assert from "node:assert/strict";
import test from "node:test";
import { escapeRegex } from "../lib/regex";

test("escapes regex metacharacters for literal search", () => {
  const input = "a[b(c)*+?^${}|\\].";
  const escaped = escapeRegex(input);

  assert.equal(escaped, String.raw`a\[b\(c\)\*\+\?\^\$\{\}\|\\\]\.`);

  const regex = new RegExp(escaped, "i");
  assert.equal(regex.test(input), true);
  assert.equal(regex.test("abc"), false);
});

test("leaves ordinary search text unchanged", () => {
  assert.equal(escapeRegex("hello world 123"), "hello world 123");
});
