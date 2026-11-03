import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIResearchSource from "@/models/AIResearchSource";
import AIStudioSettings from "@/models/AIStudioSettings";
import { syncResearchSource } from "@/lib/ai-studio/researchFetcher";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import {
  checkDistributedRateLimit,
  QuotaStoreUnavailableError,
} from "@/lib/ai-studio/rateLimiter";
import { safeErrorResponse } from "@/lib/ai-studio/errorUtils";
import mongoose from "mongoose";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_FETCH_BODY_BYTES = 4096;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access.", code: "UNAUTHORIZED" }, { status: 403 });
    }

    let body: { sourceId?: unknown };
    const bodyResult = await readLimitedRequestText(request, MAX_FETCH_BODY_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { success: false, error: tooLarge ? "Request body exceeds the 4 KB limit." : "Request body is required.", code: tooLarge ? "BODY_TOO_LARGE" : "MISSING_BODY" },
        { status: tooLarge ? 413 : 400 },
      );
    }
    try {
      const parsedBody: unknown = JSON.parse(bodyResult.text);
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        return NextResponse.json(
          { success: false, error: "Request body must be a JSON object.", code: "INVALID_BODY" },
          { status: 400 },
        );
      }
      body = parsedBody as { sourceId?: unknown };
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON.", code: "INVALID_JSON" },
        { status: 400 },
      );
    }
    const { sourceId } = body;
    if (sourceId !== undefined && (typeof sourceId !== "string" || !mongoose.isValidObjectId(sourceId))) {
      return NextResponse.json({ success: false, error: "Invalid source ID.", code: "INVALID_SOURCE_ID" }, { status: 400 });
    }

    await dbConnect();

    // 1. Kill Switch Guard
    const settings = await AIStudioSettings.findOne();
    if (settings?.killSwitch) {
      return NextResponse.json(
        { success: false, error: "AI Studio is currently disabled via Emergency Kill-Switch.", code: "KILL_SWITCH_ACTIVE" },
        { status: 503 }
      );
    }

    // 2. Distributed Rate Limit Guard (Fails closed on DB outage)
    const rl = await checkDistributedRateLimit(user.id || "admin", "research_fetch");
    if (!rl.allowed) {
      const status = rl.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        {
          success: false,
          error: rl.isServiceUnavailable
            ? "Shared rate limiting service is temporarily unavailable. Request rejected to protect external research quotas."
            : `Fetch rate limit reached. Please wait ${rl.retryAfterSeconds}s.`,
          code: rl.isServiceUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
        },
        { status }
      );
    }

    const maxDailyFetches = settings?.dailyLimits?.maxDailyResearchFetches || 50;
    const results: Awaited<ReturnType<typeof syncResearchSource>>[] = [];
    const now = Date.now();
    let quotaReached = false;
    let quotaCurrent = 0;

    const syncWithReservation = async (id: string) => {
      const res = await syncResearchSource(id, { dailyFetchLimit: maxDailyFetches });
      if (res.quotaCurrent !== undefined) quotaCurrent = res.quotaCurrent;
      if (res.quotaReached) quotaReached = true;
      results.push(res);
    };

    if (sourceId) {
      const source = await AIResearchSource.findOne({
        _id: sourceId,
        active: true,
        approvalStatus: "approved",
      }).select("_id");
      if (!source) {
        return NextResponse.json(
          { success: false, error: "Active approved research source not found.", code: "SOURCE_NOT_FOUND" },
          { status: 404 },
        );
      }
      await syncWithReservation(sourceId);
    } else {
      const activeSources = await AIResearchSource.find({
        active: true,
        approvalStatus: "approved",
      }).limit(10);
      for (const s of activeSources) {
        // Enforce cooldown interval so feeds are not hammered
        const intervalMs = (s.fetchIntervalMinutes || 360) * 60 * 1000;
        if (s.lastFetchedAt && now - new Date(s.lastFetchedAt).getTime() < intervalMs) {
          continue;
        }
        await syncWithReservation(s._id.toString());
        if (quotaReached) break;
      }
    }

    const totalNew = results.reduce((acc, r) => acc + (r.newItemsCount || 0), 0);

    if (results.length > 0) {
      await logAIStudioAction({
        action: "source_synced",
        actorType: "user",
        actorId: user.id,
        metadata: { sourcesCount: results.length, totalNewItems: totalNew },
      });
    }

    return NextResponse.json({
      success: true,
      totalNewItems: totalNew,
      quotaReached,
      quotaCurrent,
      results,
    }, {
      status: quotaReached && results.every((result) => result.quotaReached) ? 429 : 200,
    });
  } catch (error: any) {
    if (error instanceof QuotaStoreUnavailableError) {
      return NextResponse.json(
        { success: false, error: "Quota service is unavailable. No research fetch was started.", code: "QUOTA_SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }
    return safeErrorResponse(error, "Failed to complete research fetch operation.", 500, "RESEARCH_FETCH_FAILED");
  }
}
