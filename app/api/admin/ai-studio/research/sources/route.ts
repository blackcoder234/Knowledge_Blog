import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIResearchSource from "@/models/AIResearchSource";
import AIResearchItem from "@/models/AIResearchItem";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { validateResearchSourceUrl } from "@/lib/ai-studio/urlValidator";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";
import mongoose from "mongoose";

const MAX_SOURCE_REQUEST_BYTES = 16 * 1024;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const sources = await AIResearchSource.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    // Attach item counts
    const sourcesWithCounts = await Promise.all(
      sources.map(async (s) => {
        const itemCount = await AIResearchItem.countDocuments({ sourceId: s._id });
        return { ...s, itemCount };
      })
    );

    return NextResponse.json({ sources: sourcesWithCounts });
  } catch (error) {
    console.error("AI Studio research source request failed:", error);
    return NextResponse.json({ error: "Unable to process research sources." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bodyResult = await readLimitedRequestText(request, MAX_SOURCE_REQUEST_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Research source request exceeds the 16 KB limit." : "Request body is required." },
        { status: tooLarge ? 413 : 400 }
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid research source data." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const { name, url, publisher, sourceType, category, trustTier, fetchIntervalMinutes } = input;
    const allowedFields = new Set([
      "name", "url", "publisher", "sourceType", "category", "trustTier", "fetchIntervalMinutes",
    ]);
    if (Object.keys(input).some((key) => !allowedFields.has(key)) ||
        typeof name !== "string" || !name.trim() || name.length > 120 ||
        typeof url !== "string" || !url || url.length > 2048 ||
        typeof publisher !== "string" || !publisher.trim() || publisher.length > 200 ||
        (sourceType !== undefined &&
          (typeof sourceType !== "string" || !["rss", "api", "academic"].includes(sourceType))) ||
        (trustTier !== undefined &&
          (typeof trustTier !== "string" || !["verified", "primary", "secondary"].includes(trustTier))) ||
        (category !== undefined && category !== null &&
          (typeof category !== "string" || !mongoose.isValidObjectId(category))) ||
        (fetchIntervalMinutes !== undefined &&
          (typeof fetchIntervalMinutes !== "number" || !Number.isInteger(fetchIntervalMinutes) ||
            fetchIntervalMinutes < 15 || fetchIntervalMinutes > 10080))) {
      return NextResponse.json({ error: "Invalid research source data." }, { status: 400 });
    }

    // SSRF and HTTPS URL Validation
    const validation = await validateResearchSourceUrl(url);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const safeUrl = validation.normalizedUrl || url;
    const sourceTypeValue = sourceType === "api" || sourceType === "academic" ? sourceType : "rss";
    const trustTierValue = trustTier === "primary" || trustTier === "secondary" ? trustTier : "verified";

    await dbConnect();

    const existing = await AIResearchSource.findOne({ url: safeUrl });
    if (existing) {
      return NextResponse.json(
        { error: "A source with this URL already exists." },
        { status: 409 }
      );
    }

    const newSource = await AIResearchSource.create({
      name: name.trim(),
      url: safeUrl,
      publisher: publisher.trim(),
      sourceType: sourceTypeValue,
      category: category || undefined,
      trustTier: trustTierValue,
      fetchIntervalMinutes: fetchIntervalMinutes || 360,
      active: true,
      createdBy: user.id,
    });

    await logAIStudioAction({
      action: "source_synced",
      actorType: "user",
      actorId: user.id,
      metadata: { sourceName: name, url: safeUrl },
    });

    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error("AI Studio research source creation failed:", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A source with this URL already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create research source." }, { status: 500 });
  }
}
