import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIContentOpportunity from "@/models/AIContentOpportunity";
import AIResearchItem from "@/models/AIResearchItem";
import Category from "@/models/Category";
import AIStudioSettings from "@/models/AIStudioSettings";
import { calculateAudienceInterest } from "@/lib/ai-studio/interestEngine";
import { synthesizeOpportunities } from "@/lib/ai-studio/llmService";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { checkDistributedRateLimit } from "@/lib/ai-studio/rateLimiter";
import { safeErrorResponse } from "@/lib/ai-studio/errorUtils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    await dbConnect();

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const opportunities = await AIContentOpportunity.find(query)
      .populate("category", "name slug")
      .populate("convertedPostId", "title slug status")
      .sort({ audienceInterestScore: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to load opportunities", 500, "OPPORTUNITIES_LOAD_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    }

    await dbConnect();

    // Kill Switch Guard
    const settings = await AIStudioSettings.findOne();
    if (settings?.killSwitch) {
      return NextResponse.json(
        { success: false, error: "AI Studio is currently disabled via Emergency Kill-Switch.", code: "KILL_SWITCH_ACTIVE" },
        { status: 503 }
      );
    }

    // Distributed Rate Limit Guard (Fails closed on DB outage)
    const rl = await checkDistributedRateLimit(user.id || "admin", "opportunities");
    if (!rl.allowed) {
      const status = rl.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        {
          success: false,
          error: rl.isServiceUnavailable
            ? "Shared rate limiting service is temporarily unavailable. Request rejected to prevent quota abuse."
            : `Opportunity generation rate limit reached. Please wait ${rl.retryAfterSeconds}s.`,
          code: rl.isServiceUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
        },
        { status }
      );
    }

    // 1. Calculate audience interest metrics
    const categoryMetrics = await calculateAudienceInterest(30);

    // 2. Fetch recent research items
    const researchItems = await AIResearchItem.find({ status: { $ne: "archived" } })
      .populate({
        path: "sourceId",
        match: { active: true, approvalStatus: "approved" },
        select: "active approvalStatus",
      })
      .sort({ publishedAt: -1 })
      .limit(15)
      .lean();

    // 3. Synthesize opportunities
    const approvedResearchItems = researchItems.filter((item) => item.sourceId);
    const generated = await synthesizeOpportunities(categoryMetrics, approvedResearchItems);

    // 4. Map category slugs to Category ObjectIds and insert
    const categories = await Category.find().lean();
    const catMap = new Map<string, any>();
    categories.forEach((c) => catMap.set(c.slug, c._id));

    const insertedDocs = [];
    for (const item of generated) {
      const matchedCatId = catMap.get(item.categorySlug) || (categories[0] ? categories[0]._id : undefined);

      const doc = await AIContentOpportunity.create({
        proposedTitle: item.proposedTitle,
        category: matchedCatId,
        tags: item.tags,
        targetReader: item.targetReader,
        whyItMattersNow: item.whyItMattersNow,
        audienceInterestScore: item.audienceInterestScore,
        audienceInterestSignals: {
          explanation: item.scoreBreakdown?.explanation || `Synthesized from top reader engagement in ${item.categorySlug} and recent research publications.`,
        },
        scoreBreakdown: item.scoreBreakdown,
        primarySources: item.primarySources,
        researchDossier: item.researchDossier || [],
        suggestedFormat: item.suggestedFormat,
        estimatedReadTime: item.estimatedReadTime,
        duplicateRiskScore: item.duplicateRiskScore,
        confidenceScore: item.confidenceScore,
        status: "new",
      });
      insertedDocs.push(doc);
    }

    // 5. Audit log
    await logAIStudioAction({
      action: "opportunity_generated",
      actorType: "user",
      actorId: user.id,
      metadata: {
        generatedCount: insertedDocs.length,
        categoryTrendsCount: categoryMetrics.length,
      },
    });

    return NextResponse.json({
      success: true,
      count: insertedDocs.length,
      opportunities: insertedDocs,
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to generate content opportunities.", 500, "OPPORTUNITY_SYNTHESIS_FAILED");
  }
}
