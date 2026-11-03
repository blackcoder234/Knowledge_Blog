import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIContentOpportunity from "@/models/AIContentOpportunity";
import AIResearchSource from "@/models/AIResearchSource";
import AIQualityReview from "@/models/AIQualityReview";
import AIAuditLog from "@/models/AIAuditLog";
import Post from "@/models/Post";
import AIStudioSettings from "@/models/AIStudioSettings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    await dbConnect();

    // Parallel fetch counts
    const [
      newOpportunitiesCount,
      totalOpportunitiesCount,
      activeSourcesCount,
      aiDraftsCount,
      pendingReviewsCount,
      recentAuditLogs,
      settings,
    ] = await Promise.all([
      AIContentOpportunity.countDocuments({ status: "new" }),
      AIContentOpportunity.countDocuments(),
      AIResearchSource.countDocuments({ active: true }),
      Post.countDocuments({ status: "draft", isAiAssisted: true }),
      AIQualityReview.countDocuments({ passed: false }),
      AIAuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      AIStudioSettings.findOne().lean(),
    ]);

    const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

    return NextResponse.json({
      metrics: {
        newOpportunitiesCount,
        totalOpportunitiesCount,
        activeSourcesCount,
        aiDraftsCount,
        pendingReviewsCount,
      },
      killSwitch: settings?.killSwitch ?? false,
      provider: settings?.provider || "gemini",
      modelName: settings?.modelName || "gemini-3.8-flash",
      hasApiKey,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("Overview API error:", error);
    return NextResponse.json({ error: "Unable to load AI Studio overview." }, { status: 500 });
  }
}
