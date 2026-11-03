import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIStudioSettings from "@/models/AIStudioSettings";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_SETTINGS_BODY_BYTES = 16 * 1024;
const SETTINGS_FIELDS = new Set([
  "provider",
  "modelName",
  "allowCrossProviderFailover",
  "editorialVoiceInstructions",
  "qualityThresholds",
  "autoSchedulingPolicy",
  "dailyLimits",
  "killSwitch",
  "retentionDays",
]);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    let settings = await AIStudioSettings.findOne();
    if (!settings) {
      settings = await AIStudioSettings.create({});
    }

    const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

    return NextResponse.json({
      settings,
      hasApiKey,
      isSuperAdmin: user?.role === "super_admin",
    });
  } catch (error) {
    console.error("AI Studio settings request failed:", error);
    return NextResponse.json({ error: "Unable to load AI Studio settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // Guardrail: Super Admin only for critical settings & kill switch
    if (!session || user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin access required to update AI Studio settings." },
        { status: 403 }
      );
    }

    const bodyResult = await readLimitedRequestText(request, MAX_SETTINGS_BODY_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Settings request exceeds the 16 KB limit." : "Request body is required." },
        { status: tooLarge ? 413 : 400 },
      );
    }
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: "Settings must be a JSON object." }, { status: 400 });
    }
    const body = parsedBody as Record<string, unknown>;
    if (Object.keys(body).length === 0 || Object.keys(body).some((key) => !SETTINGS_FIELDS.has(key))) {
      return NextResponse.json({ error: "Settings contain unsupported fields." }, { status: 400 });
    }

    if (body.provider !== undefined && body.provider !== "gemini" && body.provider !== "openai") {
      return NextResponse.json({ error: "Invalid provider. Supported: gemini, openai" }, { status: 400 });
    }
    if (body.modelName !== undefined &&
        (typeof body.modelName !== "string" || !body.modelName.trim() || body.modelName.length > 100)) {
      return NextResponse.json({ error: "Invalid model name." }, { status: 400 });
    }
    if (body.editorialVoiceInstructions !== undefined &&
        (typeof body.editorialVoiceInstructions !== "string" || body.editorialVoiceInstructions.length > 10000)) {
      return NextResponse.json({ error: "Editorial voice instructions exceed the size limit." }, { status: 400 });
    }
    for (const key of ["killSwitch", "allowCrossProviderFailover"] as const) {
      if (body[key] !== undefined && typeof body[key] !== "boolean") {
        return NextResponse.json({ error: `${key} must be a boolean.` }, { status: 400 });
      }
    }
    if (body.retentionDays !== undefined &&
        (typeof body.retentionDays !== "number" || !Number.isInteger(body.retentionDays) ||
          body.retentionDays < 1 || body.retentionDays > 3650)) {
      return NextResponse.json({ error: "Retention days must be an integer between 1 and 3650." }, { status: 400 });
    }

    await dbConnect();

    let settings = await AIStudioSettings.findOne();
    if (!settings) {
      settings = new AIStudioSettings({});
    }

    const numericGroups: Array<{
      field: "qualityThresholds" | "dailyLimits";
      limits: Record<string, [number, number]>;
    }> = [
      {
        field: "qualityThresholds",
        limits: {
          minSourceFreshnessDays: [1, 365],
          minOverallScore: [40, 100],
          minReadabilityScore: [20, 90],
          maxDuplicateRiskScore: [5, 60],
        },
      },
      {
        field: "dailyLimits",
        limits: {
          maxDailyDraftGenerations: [1, 50],
          maxDailyResearchFetches: [5, 200],
        },
      },
    ];
    for (const { field, limits } of numericGroups) {
      const value = body[field];
      if (value === undefined) continue;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
      }
      const values = value as Record<string, unknown>;
      if (Object.keys(values).some((key) => !(key in limits))) {
        return NextResponse.json({ error: `Unsupported ${field} setting.` }, { status: 400 });
      }
      for (const [key, [min, max]] of Object.entries(limits)) {
        const number = values[key];
        if (number !== undefined &&
            (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max)) {
          return NextResponse.json({ error: `Invalid ${field}.${key}.` }, { status: 400 });
        }
      }
    }

    if (body.autoSchedulingPolicy !== undefined) {
      const policy = body.autoSchedulingPolicy;
      if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
        return NextResponse.json({ error: "Invalid auto-scheduling policy." }, { status: 400 });
      }
      const policyValues = policy as Record<string, unknown>;
      const policyFields = new Set([
        "enabled", "allowedCategories", "minQualityScoreRequired", "publishBufferHours",
      ]);
      if (Object.keys(policyValues).some((key) => !policyFields.has(key)) ||
          (policyValues.enabled !== undefined && typeof policyValues.enabled !== "boolean") ||
          (policyValues.allowedCategories !== undefined &&
            (!Array.isArray(policyValues.allowedCategories) ||
              policyValues.allowedCategories.some((id) => typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)))) ||
          (policyValues.minQualityScoreRequired !== undefined &&
            (typeof policyValues.minQualityScoreRequired !== "number" ||
              policyValues.minQualityScoreRequired < 1 || policyValues.minQualityScoreRequired > 100)) ||
          (policyValues.publishBufferHours !== undefined &&
            (typeof policyValues.publishBufferHours !== "number" ||
              policyValues.publishBufferHours < 1 || policyValues.publishBufferHours > 720))) {
        return NextResponse.json({ error: "Invalid auto-scheduling policy fields." }, { status: 400 });
      }
    }

    for (const key of SETTINGS_FIELDS) {
      if (body[key] !== undefined) {
        (settings as unknown as Record<string, unknown>)[key] = body[key];
      }
    }

    settings.updatedBy = user.id;
    await settings.save();

    await logAIStudioAction({
      action: "settings_updated",
      actorType: "user",
      actorId: user.id,
      metadata: {
        killSwitch: settings.killSwitch,
        provider: settings.provider,
        modelName: settings.modelName,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("AI Studio settings update failed:", error);
    return NextResponse.json({ error: "Unable to update AI Studio settings." }, { status: 500 });
  }
}
