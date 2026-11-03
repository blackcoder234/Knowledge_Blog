import { createHash } from "node:crypto";
import NextAuth, { type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import AIRateLimit from "@/models/AIRateLimit";
import User from "@/models/User";
import { getTrustedClientIp } from "@/lib/trustedClientIp";
import {
  findSingleUserByEmail,
  normalizeUserEmail,
} from "@/lib/userEmail";

const SESSION_MAX_AGE_SECONDS = 30 * 60;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 10;
const LOGIN_IP_LIMIT = 60;
type AuthUserRecord = {
  _id: { toString(): string } | string;
  name?: string;
  email: string;
  image?: string;
  password?: string;
  role?: string;
};

type LoginReservation = {
  allowed: boolean;
  suspicious: boolean;
  release: () => Promise<void>;
};

type LoginRateLimitStore = {
  increment: (key: string, resetAt: Date) => Promise<number>;
  decrement: (key: string) => Promise<void>;
};

export type AuthDependencies = {
  connect: () => Promise<unknown>;
  findUserByEmail: (email: string) => Promise<AuthUserRecord | null>;
  findUserById: (id: string) => Promise<AuthUserRecord | null>;
  createSocialUser: (user: {
    name: string;
    email: string;
    image?: string | null;
  }) => Promise<AuthUserRecord>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
  reserveLoginAttempt: (ip: string, email: string) => Promise<LoginReservation>;
  now: () => number;
  log: Pick<Console, "warn" | "error">;
};

type AuthToken = JWT & { id?: string; role?: string };

function normalizeEmail(email: unknown): string {
  return normalizeUserEmail(email);
}

export { getTrustedClientIp } from "@/lib/trustedClientIp";

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createLoginAttemptLimiter(
  store: LoginRateLimitStore,
  config: {
    windowMs?: number;
    emailLimit?: number;
    ipLimit?: number;
    now?: () => number;
  } = {},
): (ip: string, email: string) => Promise<LoginReservation> {
  const windowMs = config.windowMs ?? LOGIN_RATE_WINDOW_MS;
  const emailLimit = config.emailLimit ?? LOGIN_EMAIL_LIMIT;
  const ipLimit = config.ipLimit ?? LOGIN_IP_LIMIT;
  const now = config.now ?? Date.now;

  return async (ip, rawEmail) => {
    const email = normalizeEmail(rawEmail);
    if (!ip || !email || !Number.isInteger(windowMs) || windowMs <= 0) {
      throw new Error("Invalid login rate-limit identity.");
    }

    const currentTime = now();
    const bucket = Math.floor(currentTime / windowMs);
    const resetAt = new Date((bucket + 1) * windowMs);
    const ipKey = `auth:ip:${hashIdentifier(ip)}:${bucket}`;
    const emailKey = `auth:email:${hashIdentifier(email)}:${bucket}`;
    const releaseKey = async (key: string) => store.decrement(key);
    const denied = (suspicious: boolean): LoginReservation => ({
      allowed: false,
      suspicious,
      release: async () => undefined,
    });

    const ipCount = await store.increment(ipKey, resetAt);
    if (ipCount > ipLimit) {
      await releaseKey(ipKey);
      return denied(ipCount === ipLimit + 1);
    }

    const emailCount = await store.increment(emailKey, resetAt);
    if (emailCount > emailLimit) {
      await releaseKey(emailKey);
      await releaseKey(ipKey);
      return denied(emailCount === emailLimit + 1);
    }

    let released = false;
    return {
      allowed: true,
      suspicious: false,
      release: async () => {
        if (released) return;
        released = true;
        await Promise.all([releaseKey(emailKey), releaseKey(ipKey)]);
      },
    };
  };
}

const databaseLoginLimiter = createLoginAttemptLimiter({
  async increment(key, resetAt) {
    let record;
    try {
      record = await AIRateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { resetAt } },
        { upsert: true, returnDocument: "after" },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      record = await AIRateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        { returnDocument: "after" },
      );
    }
    if (!record) throw new Error("Login rate-limit record missing.");
    return record.count;
  },
  async decrement(key) {
    await AIRateLimit.updateOne({ key, count: { $gt: 0 } }, { $inc: { count: -1 } });
  },
});

async function reserveDatabaseLoginAttempt(ip: string, email: string): Promise<LoginReservation> {
  await dbConnect();
  return databaseLoginLimiter(ip, email);
}

const defaultDependencies: AuthDependencies = {
  connect: dbConnect,
  async findUserByEmail(email) {
    return findSingleUserByEmail(email);
  },
  async findUserById(id) {
    return User.findById(id);
  },
  async createSocialUser(user) {
    return User.create({ ...user, email: normalizeEmail(user.email) });
  },
  comparePassword: (password, hash) => bcrypt.compare(password, hash),
  reserveLoginAttempt: reserveDatabaseLoginAttempt,
  now: Date.now,
  log: console,
};

export function createAuthOptions(dependencies: AuthDependencies = defaultDependencies): NextAuthOptions {
  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      }),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, request) {
          const email = normalizeEmail(credentials?.email);
          const password = credentials?.password;
          if (!email || email.length > 254 || !email.includes("@") ||
              typeof password !== "string" || password.length === 0 || password.length > 1024) {
            return null;
          }

          const ip = getTrustedClientIp(request?.headers);
          if (!ip) return null;

          let reservation: LoginReservation;
          try {
            reservation = await dependencies.reserveLoginAttempt(ip, email);
          } catch {
            dependencies.log.error("Credential sign-in denied because rate-limit enforcement is unavailable.");
            return null;
          }

          if (!reservation.allowed) {
            if (reservation.suspicious) {
              dependencies.log.warn("Repeated credential sign-in attempts were rate limited.");
            }
            return null;
          }

          let user: AuthUserRecord | null;
          let isValid = false;
          try {
            await dependencies.connect();
            user = await dependencies.findUserByEmail(email);
            if (user?.password) {
              isValid = await dependencies.comparePassword(password, user.password);
            }
          } catch {
            try {
              await reservation.release();
            } catch {
              dependencies.log.error("Could not release a reserved credential sign-in attempt.");
            }
            dependencies.log.error("Credential sign-in denied because the user store is unavailable.");
            return null;
          }

          if (!user || !user.password || !isValid) {
            return null;
          }

          try {
            await reservation.release();
          } catch {
            dependencies.log.error("Could not release a successful credential sign-in attempt.");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || "user",
          };
        },
      }),
    ],
    pages: {
      signIn: "/login",
      error: "/login",
    },
    session: {
      strategy: "jwt",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
    jwt: {
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
    callbacks: {
      async signIn({ user, account }) {
        if (account?.provider !== "google" && account?.provider !== "github") return true;

        const email = normalizeEmail(user.email);
        if (!email || email.length > 254) return false;

        try {
          await dependencies.connect();
          let dbUser = await dependencies.findUserByEmail(email);
          if (!dbUser) {
            dbUser = await dependencies.createSocialUser({
              name: user.name?.trim() || email.split("@")[0],
              email,
              image: user.image,
            });
          }
          user.id = dbUser._id.toString();
          user.email = dbUser.email;
          return true;
        } catch {
          dependencies.log.error("Social sign-in denied because the user store is unavailable.");
          return false;
        }
      },
      async jwt({ token, user }) {
        const authToken = token as AuthToken;
        if (typeof authToken.exp === "number" && authToken.exp * 1000 <= dependencies.now()) {
          delete authToken.id;
          delete authToken.role;
          return null as unknown as AuthToken;
        }

        if (user?.id) authToken.id = user.id;
        const userId = authToken.id;
        const email = normalizeEmail(user?.email ?? authToken.email);
        if (!userId && !email) {
          delete authToken.id;
          delete authToken.role;
          return null as unknown as AuthToken;
        }

        try {
          await dependencies.connect();
            const dbUser = user?.email
              ? await dependencies.findUserByEmail(email)
              : userId
                ? await dependencies.findUserById(userId)
                : await dependencies.findUserByEmail(email);
          if (!dbUser) {
            delete authToken.id;
            delete authToken.role;
            return null as unknown as AuthToken;
          }

          authToken.id = dbUser._id.toString();
          authToken.email = dbUser.email;
          authToken.role = ["user", "admin", "editor", "super_admin"].includes(dbUser.role || "")
            ? dbUser.role
            : "user";
          return authToken;
        } catch {
          delete authToken.id;
          delete authToken.role;
          dependencies.log.error("Session invalidated because the user store is unavailable.");
          return null as unknown as AuthToken;
        }
      },
      async session({ session, token }) {
        if (session.user) {
          const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
          const authToken = token as AuthToken;
          if (authToken.id && authToken.role) {
            sessionUser.id = authToken.id;
            sessionUser.role = authToken.role;
          } else {
            delete sessionUser.id;
            delete sessionUser.role;
          }
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

export const authOptions = createAuthOptions();
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
