import assert from "node:assert/strict";
import { before, test } from "node:test";
import type { AuthDependencies } from "../../app/api/auth/[...nextauth]/route";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/test_knowledgelog";

let authModule: typeof import("../../app/api/auth/[...nextauth]/route");

before(async () => {
  authModule = await import("../../app/api/auth/[...nextauth]/route");
});

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => "user-1" },
    name: "Test User",
    email: "person@example.com",
    image: "https://example.com/avatar.png",
    password: "hashed-password",
    role: "user",
    ...overrides,
  };
}

function makeDependencies(overrides: Record<string, unknown> = {}) {
  const record = makeUser();
  const calls = { connect: 0, byEmail: 0, byId: 0, warnings: [] as string[], errors: [] as string[] };
  const dependencies: AuthDependencies = {
    async connect() {
      calls.connect++;
    },
    async findUserByEmail() {
      calls.byEmail++;
      return record as never;
    },
    async findUserById() {
      calls.byId++;
      return record as never;
    },
    async createSocialUser() {
      return record as never;
    },
    async comparePassword(password, hash) {
      return password === "correct-password" && hash === "hashed-password";
    },
    async reserveLoginAttempt() {
      return { allowed: true, suspicious: false, release: async () => undefined };
    },
    now: () => Date.now(),
    log: {
      warn(message) {
        calls.warnings.push(message);
      },
      error(message) {
        calls.errors.push(message);
      },
    },
    ...overrides,
  } as AuthDependencies;

  return { dependencies, record, calls };
}

function credentialsAuthorize(options: ReturnType<typeof authModule.createAuthOptions>) {
  const credentialsProvider = options.providers.find((provider) => provider.id === "credentials");
  assert.ok(credentialsProvider && "authorize" in credentialsProvider);
  const provider = credentialsProvider as unknown as {
    options: {
      authorize: (
        credentials: unknown,
        request: unknown,
      ) => Promise<{ id?: string; email?: string } | null>;
    };
  };
  return provider.options.authorize;
}

test("valid credential sign-in normalizes email and returns database identity", async () => {
  const { dependencies, calls } = makeDependencies();
  const options = authModule.createAuthOptions(dependencies);
  assert.equal(authModule.getTrustedClientIp({ "x-real-ip": "203.0.113.10" }), "203.0.113.10");
  const user = await credentialsAuthorize(options)(
    { email: " PERSON@EXAMPLE.COM ", password: "correct-password" },
    { headers: { "x-real-ip": "203.0.113.10" } } as never,
  );

  assert.ok(user, JSON.stringify(calls));
  assert.equal(user.id, "user-1");
  assert.equal(user?.email, "person@example.com");
  assert.equal(calls.byEmail, 1);
});

test("unknown, social-only, and invalid-password attempts share the same credentials result", async () => {
  const outcomes: string[] = [];

  for (const attempt of [
    { user: null, password: "anything" },
    { user: makeUser({ password: undefined }), password: "anything" },
    { user: makeUser(), password: "incorrect-password" },
  ]) {
    const { dependencies } = makeDependencies({
      async findUserByEmail() {
        return attempt.user as never;
      },
    });
    const authorize = credentialsAuthorize(authModule.createAuthOptions(dependencies));
    const result = await authorize(
      { email: "person@example.com", password: attempt.password },
      { headers: { "x-real-ip": "203.0.113.10" } } as never,
    );
    outcomes.push(result === null ? "CredentialsSignin" : "success");
  }

  assert.deepEqual(outcomes, ["CredentialsSignin", "CredentialsSignin", "CredentialsSignin"]);
});

test("deleted database user invalidates the JWT", async () => {
  const { dependencies } = makeDependencies({
    async findUserById() {
      return null;
    },
  });
  const jwt = authModule.createAuthOptions(dependencies).callbacks!.jwt!;
  const token: Record<string, unknown> = {
    id: "deleted-user",
    role: "admin",
    email: "person@example.com",
  };

  assert.equal(await jwt({ token, user: undefined } as never), null);
  assert.equal("role" in token, false);
});

test("JWT role is refreshed from the database on every callback", async () => {
  let currentRole = "admin";
  const { dependencies, calls } = makeDependencies({
    async findUserById() {
      calls.byId++;
      return makeUser({ role: currentRole }) as never;
    },
  });
  const jwt = authModule.createAuthOptions(dependencies).callbacks!.jwt!;

  const token = await jwt({
    token: { id: "user-1", role: "user", email: "person@example.com" },
    user: undefined,
  } as never);
  assert.equal((token as { role?: string }).role, "admin");

  currentRole = "user";
  const refreshed = await jwt({ token: token!, user: undefined } as never);
  assert.equal((refreshed as { role?: string }).role, "user");
  assert.equal(calls.byId, 2);
});

test("Google and GitHub sign-in keep resolving the local account by email", async () => {
  const { dependencies, record, calls } = makeDependencies();
  const callbacks = authModule.createAuthOptions(dependencies).callbacks!;
  const user = {
    id: "oauth-provider-id",
    email: "PERSON@EXAMPLE.COM",
    name: "Test User",
  };
  const accepted = await callbacks.signIn!({
    user,
    account: { provider: "google" },
  } as never);

  assert.equal(accepted, true);
  assert.equal(user.id, "user-1");

  const token = await callbacks.jwt!({
    token: { id: "oauth-provider-id", email: "person@example.com" },
    user: { id: "oauth-provider-id", email: "person@example.com" },
  } as never);
  assert.equal((token as { id?: string }).id, "user-1");
  assert.equal(calls.byEmail, 2);
  assert.equal(record.email, "person@example.com");
});

test("social sign-in creates a local account when needed", async () => {
  const record = makeUser({ password: undefined });
  let createdEmail = "";
  const { dependencies } = makeDependencies({
    async findUserByEmail() {
      return null;
    },
    async createSocialUser(input: { email: string }) {
      createdEmail = input.email;
      return record as never;
    },
  });
  const user = { id: "github-id", email: "PERSON@EXAMPLE.COM", name: "Test User" };
  const accepted = await authModule.createAuthOptions(dependencies).callbacks!.signIn!({
    user,
    account: { provider: "github" },
  } as never);

  assert.equal(accepted, true);
  assert.equal(createdEmail, "person@example.com");
  assert.equal(user.id, "user-1");
});

test("session and JWT lifetime is explicitly 30 minutes and expired callbacks invalidate tokens", async () => {
  const { dependencies, calls } = makeDependencies({
    now: () => 1_800_000,
  });
  const options = authModule.createAuthOptions(dependencies);
  const jwt = options.callbacks!.jwt!;
  const expiredToken = { id: "user-1", role: "admin", exp: 1799 };

  assert.equal(options.session?.maxAge, 1800);
  assert.equal(options.jwt?.maxAge, 1800);
  assert.equal(await jwt({ token: expiredToken, user: undefined } as never), null);
  assert.equal(calls.connect, 0);
});

test("database lookup outage invalidates session authorization claims", async () => {
  const { dependencies, calls } = makeDependencies({
    async connect() {
      throw new Error("sensitive database URI must not be logged");
    },
  });
  const jwt = authModule.createAuthOptions(dependencies).callbacks!.jwt!;
  const token: Record<string, unknown> = {
    id: "user-1",
    role: "admin",
    email: "person@example.com",
  };

  assert.equal(await jwt({ token, user: undefined } as never), null);
  assert.equal("role" in token, false);
  assert.equal(calls.errors.length, 1);
  assert.equal(calls.errors[0].includes("sensitive"), false);
});

test("Mongo-backed limiter applies both normalized-email and IP buckets", async () => {
  const counts = new Map<string, number>();
  const limiter = authModule.createLoginAttemptLimiter({
    async increment(key) {
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      return count;
    },
    async decrement(key) {
      counts.set(key, Math.max(0, (counts.get(key) || 0) - 1));
    },
  }, { windowMs: 60_000, emailLimit: 2, ipLimit: 3, now: () => 120_000 });

  const first = await limiter("203.0.113.20", "PERSON@example.com");
  const second = await limiter("203.0.113.20", "person@example.com");
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  const emailBlocked = await limiter("203.0.113.20", "person@example.com");
  assert.equal(emailBlocked.allowed, false);
  assert.equal(emailBlocked.suspicious, true);

  const rotatedEmailOne = await limiter("203.0.113.21", "another@example.com");
  const rotatedEmailTwo = await limiter("203.0.113.21", "new@example.com");
  const thirdIpAttempt = await limiter("203.0.113.21", "third@example.com");
  const ipBlocked = await limiter("203.0.113.21", "fourth@example.com");
  assert.equal(rotatedEmailOne.allowed, true);
  assert.equal(rotatedEmailTwo.allowed, true);
  assert.equal(thirdIpAttempt.allowed, true);
  assert.equal(ipBlocked.allowed, false);
  assert.equal(ipBlocked.suspicious, true);
});

test("trusted IP parsing ignores spoofable forwarded headers in production", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalEnvironment = environment.NODE_ENV;
  environment.NODE_ENV = "production";
  try {
    assert.equal(
      authModule.getTrustedClientIp({ "x-forwarded-for": "198.51.100.10" }),
      null,
    );
    assert.equal(
      authModule.getTrustedClientIp({ "x-real-ip": "198.51.100.10" }),
      "198.51.100.10",
    );
    assert.equal(
      authModule.getTrustedClientIp({
        "x-real-ip": "invalid",
        "x-forwarded-for": "198.51.100.10",
      }),
      null,
    );
  } finally {
    if (originalEnvironment === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = originalEnvironment;
  }
});

test("rate-limited credential attempts remain generic and suspicious logs contain no identifiers", async () => {
  const { dependencies, calls } = makeDependencies({
    async reserveLoginAttempt() {
      return { allowed: false, suspicious: true, release: async () => undefined };
    },
  });
  const authorize = credentialsAuthorize(authModule.createAuthOptions(dependencies));
  const result = await authorize(
    { email: "private@example.com", password: "secret" },
    { headers: { "x-real-ip": "203.0.113.99" } } as never,
  );

  assert.equal(result, null);
  assert.deepEqual(calls.warnings, ["Repeated credential sign-in attempts were rate limited."]);
  assert.equal(JSON.stringify(calls.warnings).includes("private@example.com"), false);
  assert.equal(JSON.stringify(calls.warnings).includes("203.0.113.99"), false);
});
