import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config";

test("allows HTTPS ui-avatars.com images used for admin-created users", async () => {
  const imageConfig = nextConfig.images;
  assert.ok(imageConfig && "remotePatterns" in imageConfig);

  const remotePatterns = imageConfig.remotePatterns || [];
  assert.equal(
    remotePatterns.some(
      (pattern) =>
        typeof pattern !== "string" &&
        pattern.protocol === "https" &&
        pattern.hostname === "ui-avatars.com",
    ),
    true,
  );
});
