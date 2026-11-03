import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import AIQualityReview from "@/models/AIQualityReview";
import AIContentOpportunity from "@/models/AIContentOpportunity";
import AIStudioSettings from "@/models/AIStudioSettings";
import { auditPostDraft } from "@/lib/ai-studio/qualityGate";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { checkDistributedRateLimit } from "@/lib/ai-studio/rateLimiter";
import { safeErrorResponse } from "@/lib/ai-studio/errorUtils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const { postId } = await params;
    await dbConnect();

    const [review, post] = await Promise.all([
      AIQualityReview.findOne({ postId }).sort({ createdAt: -1 }).lean(),
      Post.findById(postId).select("title slug image readTime excerpt status").lean(),
    ]);

    if (!review) {
      return NextResponse.json({ review: null, post });
    }

    return NextResponse.json({ review, post });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to load quality review.", 500, "REVIEW_LOAD_FAILED");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const { postId } = await params;
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
    const rl = await checkDistributedRateLimit(user.id || "admin", "quality_review");
    if (!rl.allowed) {
      const status = rl.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        {
          success: false,
          error: rl.isServiceUnavailable
            ? "Shared rate limiting service is temporarily unavailable. Request rejected to prevent quota abuse."
            : `Review rate limit reached. Please wait ${rl.retryAfterSeconds}s.`,
          code: rl.isServiceUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
        },
        { status }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Extract plain text
    let plainText = "";
    if (post.contentJson?.content) {
      const extractText = (node: any): string => {
        if (node.type === "text") return node.text || "";
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join(" ");
        }
        return "";
      };
      plainText = extractText(post.contentJson);
    } else {
      plainText = (post.content || "").replace(/<[^>]*>/g, " ");
    }

    // Lookup linked opportunity if any for sources
    let primarySources: any[] = [];
    if (post.aiOpportunityId) {
      const opp = await AIContentOpportunity.findById(post.aiOpportunityId).lean();
      if (opp?.primarySources) primarySources = opp.primarySources;
    }

    const review = await auditPostDraft({
      postId: post._id.toString(),
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      plainText,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      image: post.image,
      tags: post.tags,
      primarySources,
    });

    await logAIStudioAction({
      action: "quality_reviewed",
      actorType: "user",
      actorId: user.id,
      targetPostId: post._id,
      metadata: {
        score: review.overallScore,
        passed: review.passed,
      },
    });

    return NextResponse.json({
      success: true,
      review,
      post: {
        _id: post._id,
        title: post.title,
        slug: post.slug,
        image: post.image,
        readTime: post.readTime,
        status: post.status,
      },
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to run quality review.", 500, "QUALITY_REVIEW_FAILED");
  }
}

