import dbConnect from "@/lib/db";
import AIRateLimit from "@/models/AIRateLimit";
import AIResearchSource from "@/models/AIResearchSource";

/**
 * In-memory sliding-window rate limiter for AI Studio endpoints.
 * Operates as a fast local fallback or L1 shield.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 10 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 600000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 600000);
  cleanupTimer.unref?.();
}

export interface RateLimitConfig {
  maxRequests: number; // e.g. 10 requests
  windowMs: number;    // e.g. 60000 ms (1 minute)
}

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  chat: { maxRequests: 25, windowMs: 600000 },          // 25 per 10 mins
  opportunities: { maxRequests: 12, windowMs: 600000 }, // 12 per 10 mins
  draft_convert: { maxRequests: 8, windowMs: 600000 },  // 8 per 10 mins
  image_generate: { maxRequests: 12, windowMs: 600000 },// 12 per 10 mins
  research_fetch: { maxRequests: 8, windowMs: 600000 }, // 8 per 10 mins
  quality_review: { maxRequests: 20, windowMs: 600000 },// 20 per 10 mins
  registration: { maxRequests: 5, windowMs: 600000 },  // 5 per 10 mins
  tracking: { maxRequests: 180, windowMs: 600000 },     // 180 per 10 mins per client address
  csp_reports: { maxRequests: 60, windowMs: 60000 },    // 60 reports per minute per client address
  comments: { maxRequests: 10, windowMs: 600000 },      // 10 comments per 10 mins per user
  contact: { maxRequests: 5, windowMs: 600000 },        // 5 contact messages per 10 mins per address
  subscribe: { maxRequests: 5, windowMs: 600000 },      // 5 subscription attempts per 10 mins per address
};

/**
 * Process-local rate limiter check.
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMIT_PRESETS
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const config = RATE_LIMIT_PRESETS[action] || { maxRequests: 20, windowMs: 60000 };
  const key = `${identifier}:${action}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < config.windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + config.windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  error?: string;
  isServiceUnavailable?: boolean;
}

/**
 * Distributed rate limiter backed by MongoDB atomic upserts with TTL expiration.
 * Enforces shared rate quotas across multi-instance and serverless Vercel deployments.
 * FAILS CLOSED: Rejects expensive AI operations when shared database quota state cannot be verified.
 */
export async function checkDistributedRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMIT_PRESETS,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || RATE_LIMIT_PRESETS[action] || { maxRequests: 20, windowMs: 60000 };
  const now = Date.now();
  const bucket = Math.floor(now / config.windowMs);
  const key = `rl:${identifier}:${action}:${bucket}`;
  const resetAt = new Date((bucket + 1) * config.windowMs);

  try {
    await dbConnect();
    let doc;
    try {
      doc = await AIRateLimit.findOneAndUpdate(
        { key },
        {
          $inc: { count: 1 },
          $setOnInsert: { resetAt },
        },
        { upsert: true, returnDocument: "after" }
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      doc = await AIRateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        { returnDocument: "after" },
      );
    }
    if (!doc) throw new Error("Distributed rate-limit record disappeared during update.");

    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000));
    if (doc.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - doc.count),
      retryAfterSeconds: 0,
    };
  } catch (err: any) {
    // FAIL CLOSED: Never silently degrade to process-local memory for multi-instance deployments.
    // If the shared MongoDB rate limit store cannot be reached, reject the request safely with 503.
    console.error("Distributed rate limiter failed closed due to database error:", err?.message || err);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 30,
      error: "Shared quota service temporarily unavailable. Rate limit enforcement failed closed to protect AI quota.",
      isServiceUnavailable: true,
    };
  }
}

export class QuotaStoreUnavailableError extends Error {
  constructor() {
    super("Quota state could not be verified or persisted.");
    this.name = "QuotaStoreUnavailableError";
  }
}

function utcDayWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function reserveDailyQuota(
  name: "research_fetch" | "draft_generation",
  limit: number,
  initialUsage = 0,
  now = new Date(),
): Promise<{ allowed: boolean; current: number; remaining: number; resetsAt: Date }> {
  if (!Number.isInteger(limit) || limit < 0 || !Number.isFinite(initialUsage) || initialUsage < 0) {
    throw new TypeError("Daily quota limit and initial usage must be non-negative numbers.");
  }

  const { start, end } = utcDayWindow(now);
  const day = start.toISOString().slice(0, 10);
  const key = `daily:${name}:${day}`;

  try {
    await dbConnect();
    try {
      await AIRateLimit.updateOne(
        { key },
        { $setOnInsert: { count: Math.floor(initialUsage), resetAt: end } },
        { upsert: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }

    const reservation = await AIRateLimit.findOneAndUpdate(
      { key, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );

    if (reservation) {
      return {
        allowed: true,
        current: reservation.count,
        remaining: Math.max(0, limit - reservation.count),
        resetsAt: end,
      };
    }

    const current = await AIRateLimit.findOne({ key }).select("count").lean();
    if (!current) throw new Error("Quota record disappeared during reservation.");
    return {
      allowed: false,
      current: current.count,
      remaining: 0,
      resetsAt: end,
    };
  } catch (error) {
    console.error(`Daily ${name} quota reservation failed:`, error);
    throw new QuotaStoreUnavailableError();
  }
}

export async function reserveDailyResearchFetch(limit: number, now = new Date()) {
  try {
    const { start, end } = utcDayWindow(now);
    await dbConnect();
    const [previousFetches, legacyCounter] = await Promise.all([
    AIResearchSource.countDocuments({
      lastFetchedAt: { $gte: start, $lt: end },
    }),
    AIRateLimit.findOne({
      key: `daily_fetches:${start.toISOString().slice(0, 10)}`,
    }).select("count").lean(),
    ]);
    return await reserveDailyQuota(
    "research_fetch",
    limit,
    Math.max(previousFetches, legacyCounter?.count || 0),
    now,
    );
  } catch (error) {
    if (error instanceof QuotaStoreUnavailableError) throw error;
    console.error("Daily research quota initialization failed:", error);
    throw new QuotaStoreUnavailableError();
  }
}

export async function getDailyActualSourceFetches(now = new Date()): Promise<number> {
  const { start, end } = utcDayWindow(now);
  await dbConnect();
  const sourcesFetchedToday = await AIResearchSource.countDocuments({
    lastFetchedAt: { $gte: start, $lt: end },
  });
  const day = start.toISOString().slice(0, 10);
  const [reservation, legacyCounter] = await Promise.all([
    AIRateLimit.findOne({ key: `daily:research_fetch:${day}` }).select("count").lean(),
    AIRateLimit.findOne({ key: `daily_fetches:${day}` }).select("count").lean(),
  ]);
  return Math.max(sourcesFetchedToday, reservation?.count || 0, legacyCounter?.count || 0);
}
