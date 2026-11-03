import assert from "node:assert/strict";
import { after, test } from "node:test";
import { getRequestClientKey } from "../lib/requestClientKey";
import { getTrustedClientIp } from "../lib/trustedClientIp";

const environment = process.env as Record<string, string | undefined>;
const originalNodeEnv = environment.NODE_ENV;

after(() => {
  if (originalNodeEnv === undefined) delete environment.NODE_ENV;
  else environment.NODE_ENV = originalNodeEnv;
});

test("production accepts only a valid platform-provided x-real-ip", () => {
  environment.NODE_ENV = "production";

  assert.equal(
    getTrustedClientIp({
      "x-real-ip": "198.51.100.10",
      "x-forwarded-for": "203.0.113.20",
    }),
    "198.51.100.10",
  );
  assert.equal(
    getTrustedClientIp({
      "x-real-ip": "not-an-ip",
      "x-forwarded-for": "203.0.113.20",
    }),
    null,
  );
  assert.equal(
    getTrustedClientIp({ "x-forwarded-for": "203.0.113.20" }),
    null,
  );
});

test("production rate-limit keys do not vary with spoofed forwarded headers", () => {
  environment.NODE_ENV = "production";
  const first = new Request("https://example.test/api", {
    headers: { "x-forwarded-for": "198.51.100.1" },
  });
  const second = new Request("https://example.test/api", {
    headers: { "x-forwarded-for": "203.0.113.2" },
  });

  assert.equal(getRequestClientKey(first), null);
  assert.equal(getRequestClientKey(second), null);
  assert.equal(getRequestClientKey(first), getRequestClientKey(second));
});

test("request client key differentiates fallback identities when IP is unavailable", () => {
  environment.NODE_ENV = "production";
  const requestA = new Request("https://example.test/api");
  const requestB = new Request("https://example.test/api");

  const keyA = getRequestClientKey(requestA, "userA@example.com");
  const keyB = getRequestClientKey(requestB, "userB@example.com");

  assert.ok(keyA);
  assert.ok(keyB);
  assert.notEqual(keyA, keyB);

  // Same identity produces matching key
  const keyA2 = getRequestClientKey(requestA, " USERA@EXAMPLE.COM ");
  assert.equal(keyA, keyA2);

  // Trusted IP takes precedence over fallback identity
  const requestWithIp = new Request("https://example.test/api", {
    headers: { "x-real-ip": "198.51.100.5" },
  });
  const keyWithIp = getRequestClientKey(requestWithIp, "userA@example.com");
  assert.notEqual(keyWithIp, keyA);
  assert.equal(keyWithIp, getRequestClientKey(requestWithIp));
});

test("development accepts only a valid first forwarded address as a fallback", () => {
  environment.NODE_ENV = "development";

  assert.equal(
    getTrustedClientIp({ "x-forwarded-for": "2001:db8::1, 198.51.100.2" }),
    "2001:db8::1",
  );
  assert.equal(
    getTrustedClientIp({ "x-forwarded-for": "invalid, 198.51.100.2" }),
    null,
  );
});
