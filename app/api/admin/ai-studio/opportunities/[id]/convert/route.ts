import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIContentOpportunity from "@/models/AIContentOpportunity";
import Post from "@/models/Post";
import PostRevision from "@/models/PostRevision";
import AIStudioSettings from "@/models/AIStudioSettings";
import Category from "@/models/Category";
import { generateBrief, generateDraftSections } from "@/lib/ai-studio/llmService";
import { buildTipTapDraft } from "@/lib/ai-studio/tiptapGenerator";
import { auditPostDraft } from "@/lib/ai-studio/qualityGate";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { generateCoverImage } from "@/lib/ai-studio/imageService";
import {
  checkDistributedRateLimit,
  QuotaStoreUnavailableError,
  reserveDailyQuota,
} from "@/lib/ai-studio/rateLimiter";
import { safeErrorResponse } from "@/lib/ai-studio/errorUtils";
import {
  claimConversionJob,
  completeConversionJob,
  failConversionJob,
  recoverConversionPost,
  releaseConversionJob,
  startConversionHeartbeat,
} from "@/lib/ai-studio/conversionJobs";
import AIAuditLog from "@/models/AIAuditLog";
import mongoose from "mongoose";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let activeHeartbeat: ReturnType<typeof startConversionHeartbeat> | undefined;
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access.", code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Check kill switch
    const settings = await AIStudioSettings.findOne();
    if (settings?.killSwitch) {
      return NextResponse.json(
        {
          success: false,
          error: "AI Studio is currently disabled via Emergency Kill-Switch.",
          code: "KILL_SWITCH_ACTIVE",
        },
        { status: 503 }
      );
    }

    // Shared Distributed Rate Limit Guard (Fails closed on DB outage)
    const rl = await checkDistributedRateLimit(user.id || "admin", "draft_convert");
    if (!rl.allowed) {
      const status = rl.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        {
          success: false,
          error: rl.isServiceUnavailable
            ? "Shared rate limiting service is temporarily unavailable. Request rejected to prevent quota abuse."
            : `Draft generation rate limit reached. Please wait ${rl.retryAfterSeconds}s.`,
          code: rl.isServiceUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
        },
        { status }
      );
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid opportunity ID.", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Idempotency Recovery Check:
    // If a draft post was already created for this opportunity, recover and return it instead of duplicating
    const existingPost = await Post.findOne({ aiOpportunityId: id });
    if (existingPost) {
      await recoverConversionPost(id, existingPost._id);
      return NextResponse.json({
        success: true,
        recovered: true,
        postId: existingPost._id,
        slug: existingPost.slug,
        message: "Recovered existing draft post associated with this opportunity.",
      });
    }

    // Durable Job ID & Atomic Claim with Stalled Job Recovery:
    const previousOpportunity = await AIContentOpportunity.findById(id).select("status").lean();
    const claimedJob = await claimConversionJob(id);

    if (!claimedJob) {
      const existingOpp = await AIContentOpportunity.findById(id);
      if (!existingOpp) {
        return NextResponse.json(
          { success: false, error: "Opportunity not found.", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Opportunity cannot be converted because it is currently in "${existingOpp.status}" status.`,
          code: "CONFLICT_STATUS",
        },
        { status: 409 }
      );
    }
    const jobId = claimedJob.jobId;
    const heartbeat = startConversionHeartbeat(id, jobId);
    activeHeartbeat = heartbeat;
    if (!(await heartbeat.ready)) {
      heartbeat.stop();
      activeHeartbeat = undefined;
      return NextResponse.json(
        {
          success: false,
          error: "Conversion lease expired or was replaced before generation started.",
          code: "CONVERSION_LEASE_LOST",
        },
        { status: 409 },
      );
    }

    const opp = await AIContentOpportunity.findById(id);
    if (!opp) {
      heartbeat.stop();
      activeHeartbeat = undefined;
      return NextResponse.json(
        { success: false, error: "Opportunity not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const quotaStatusToRestore =
      previousOpportunity?.status && previousOpportunity.status !== "converting"
        ? previousOpportunity.status
        : "approved";

    const existingPostAfterClaim = await Post.findOne({ aiOpportunityId: id });
    if (existingPostAfterClaim) {
      await completeConversionJob(id, jobId, existingPostAfterClaim._id);
      heartbeat.stop();
      activeHeartbeat = undefined;
      return NextResponse.json({
        success: true,
        recovered: true,
        postId: existingPostAfterClaim._id,
        slug: existingPostAfterClaim.slug,
        message: "Recovered existing draft post associated with this opportunity.",
      });
    }

    try {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
      const draftsToday = await AIAuditLog.countDocuments({
        action: "draft_generated",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });
      const maxDaily = settings?.dailyLimits?.maxDailyDraftGenerations || 10;
      const reservation = await reserveDailyQuota("draft_generation", maxDaily, draftsToday);

      if (!reservation.allowed) {
        await releaseConversionJob(id, jobId, quotaStatusToRestore);
        heartbeat.stop();
        activeHeartbeat = undefined;
        await logAIStudioAction({
          action: "limit_exceeded",
          actorType: "user",
          actorId: user.id,
          metadata: {
            limitType: "daily_drafts",
            current: reservation.current,
            max: maxDaily,
          },
        });
        return NextResponse.json(
          {
            success: false,
            error: `Daily draft limit (${maxDaily}) reached. Quota resets at midnight UTC.`,
            code: "DAILY_LIMIT_EXCEEDED",
          },
          { status: 429 },
        );
      }
    } catch (error) {
      await releaseConversionJob(id, jobId, quotaStatusToRestore).catch((restoreError) => {
        console.error("Could not release conversion claim after quota error:", restoreError);
      });
      heartbeat.stop();
      activeHeartbeat = undefined;
      if (error instanceof QuotaStoreUnavailableError) throw error;
      console.error("Daily draft quota verification failed:", error);
      throw new QuotaStoreUnavailableError();
    }

    let createdPost: any = null;

    try {
      // 1. Generate Brief
      const brief = await generateBrief(opp);
      opp.brief = brief;

      // 2. Generate Sections (strictly requires genuine LLM output)
      const sectionResult = await generateDraftSections(opp, brief);
      const sections = sectionResult.sections;

      // 3. Build TipTap JSON + HTML
      const draftOutput = buildTipTapDraft(sections, opp.primarySources || []);

      // 4. Ensure Unique Slug
      const baseSlug =
        brief.suggestedSlug ||
        opp.proposedTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
      let candidateSlug = baseSlug;
      let counter = 1;
      while (await Post.findOne({ slug: candidateSlug })) {
        candidateSlug = `${baseSlug}-${counter++}`;
      }

      // Resolve safe Category ID
      let postCategory = opp.category;
      if (!postCategory) {
        const defaultCat = await Category.findOne();
        postCategory = defaultCat?._id;
      }

      // 5. Generate Tailored Cover Image (AI + Cloudinary)
      let coverImageUrl =
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
      try {
        coverImageUrl = await generateCoverImage({
          title: opp.proposedTitle,
          category: opp.category?.toString(),
          tags: opp.tags,
          thesis: brief.thesis,
        });
      } catch (imgErr) {
        console.warn("Cover image generation warning, using curated fallback:", imgErr);
      }

      // 6. Create Draft Post with Duplicate-Key Recovery (Guarantees zero duplicate drafts and handles slug races)
      const postPayload = {
        title: opp.proposedTitle,
        slug: candidateSlug,
        excerpt: brief.seoDescription || opp.whyItMattersNow,
        content: draftOutput.contentHtml,
        contentJson: draftOutput.contentJson,
        category: postCategory,
        author: user.id,
        image: coverImageUrl,
        tags: opp.tags || ["Technology"],
        readTime: draftOutput.readTime,
        status: "draft" as const, // Invariant: Always created as draft
        isAiAssisted: true,
        aiOpportunityId: opp._id,
        seoTitle: brief.seoTitle,
        seoDescription: brief.seoDescription,
      };

      if (!heartbeat.ownsLease()) {
        throw new Error("Conversion lease was lost before the draft could be saved.");
      }

      try {
        createdPost = await Post.create(postPayload);
      } catch (createErr: any) {
        if (createErr?.code === 11000) {
          // Check if collision occurred on aiOpportunityId
          const existingByOpp = await Post.findOne({ aiOpportunityId: opp._id });
          if (existingByOpp) {
            createdPost = existingByOpp;
          } else {
            // Collision occurred on slug; retry with timestamp suffix
            const emergencySlug = `${candidateSlug}-${Date.now().toString(36)}`;
            createdPost = await Post.create({
              ...postPayload,
              slug: emergencySlug,
            });
          }
        } else {
          throw createErr;
        }
      }

      // The unique aiOpportunityId index makes this finalization idempotent.
      const completed = await completeConversionJob(id, jobId, createdPost._id);
      if (!completed) {
        console.warn("Draft was created after its conversion lease was replaced; a later request will recover it.");
      }

      // 8. Safe Non-fatal PostRevision Creation
      try {
        await PostRevision.create({
          postId: createdPost._id,
          title: createdPost.title,
          excerpt: createdPost.excerpt,
          content: createdPost.content,
          contentJson: createdPost.contentJson,
          author: user.id,
          tags: createdPost.tags,
          image: createdPost.image,
        });
      } catch (revErr) {
        console.warn("Initial revision creation warning (non-fatal):", revErr);
      }

      // 9. Safe Non-fatal Quality Gate Review
      let qualityReview = null;
      try {
        qualityReview = await auditPostDraft({
          postId: createdPost._id.toString(),
          title: createdPost.title,
          excerpt: createdPost.excerpt,
          content: createdPost.content,
          plainText: draftOutput.plainText,
          seoTitle: createdPost.seoTitle,
          seoDescription: createdPost.seoDescription,
          image: createdPost.image,
          tags: createdPost.tags,
          primarySources: opp.primarySources,
        });
      } catch (auditErr) {
        console.warn("Quality gate audit warning (non-fatal):", auditErr);
      }

      // 10. Safe Non-fatal Audit Log
      try {
        await logAIStudioAction({
          action: "draft_generated",
          actorType: "user",
          actorId: user.id,
          targetPostId: createdPost._id,
          targetOpportunityId: opp._id,
          metadata: {
            title: createdPost.title,
            slug: createdPost.slug,
            wordCount: draftOutput.wordCount,
            readTime: draftOutput.readTime,
            initialQualityScore: qualityReview?.overallScore,
            provider: sectionResult.provider,
            model: sectionResult.model,
          },
        });
      } catch (logErr) {
        console.warn("Audit log warning (non-fatal):", logErr);
      }

      return NextResponse.json({
        success: true,
        postId: createdPost._id,
        slug: createdPost.slug,
        qualityScore: qualityReview?.overallScore,
        passedQualityGate: qualityReview?.passed,
        providerUsed: sectionResult.provider,
        modelUsed: sectionResult.model,
      });
    } catch (genError: any) {
      if (createdPost) {
        await completeConversionJob(id, jobId, createdPost._id);
        return NextResponse.json({
          success: true,
          postId: createdPost._id,
          slug: createdPost.slug,
          warning: "Draft was created successfully, but a subsequent non-fatal step had warnings.",
        });
      }

      try {
        const markedFailed = await failConversionJob(
          id,
          jobId,
          genError?.message || "Generation failed before post creation",
        );
        if (!markedFailed) {
          console.warn("Skipped failure update because this conversion no longer owns the opportunity.");
        }
      } catch (revertErr) {
        console.error("Failed to update opportunity error state:", revertErr);
      }

      return safeErrorResponse(
        genError,
        "Failed to generate article draft. Please review provider configuration or retry.",
        500,
        "DRAFT_GENERATION_FAILED"
      );
    } finally {
      heartbeat.stop();
      activeHeartbeat = undefined;
    }
  } catch (error: any) {
    activeHeartbeat?.stop();
    if (error instanceof QuotaStoreUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          error: "Quota service is unavailable. Draft generation was not started.",
          code: "QUOTA_SERVICE_UNAVAILABLE",
        },
        { status: 503 },
      );
    }
    return safeErrorResponse(
      error,
      "An unexpected error occurred during draft conversion.",
      500,
      "CONVERSION_ERROR"
    );
  }
}
