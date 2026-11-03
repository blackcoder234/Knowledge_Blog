import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import AIStudioSettings from "@/models/AIStudioSettings";
import { AIStudioDisabledError, generateCoverImage } from "@/lib/ai-studio/imageService";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import { checkDistributedRateLimit } from "@/lib/ai-studio/rateLimiter";
import { safeErrorResponse } from "@/lib/ai-studio/errorUtils";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const bodyResult = await readLimitedRequestText(request, 8 * 1024);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        {
          success: false,
          error: tooLarge ? "Image generation request exceeds the 8 KB limit." : "Request body is required.",
          code: tooLarge ? "INPUT_TOO_LARGE" : "INVALID_INPUT",
        },
        { status: tooLarge ? 413 : 400 },
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ success: false, error: "Request body must be valid JSON.", code: "INVALID_JSON" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid request body.", code: "INVALID_INPUT" }, { status: 400 });
    }
    const input = body as {
      postId?: unknown;
      title?: unknown;
      tags?: unknown;
      customPrompt?: unknown;
    };

    if (
      (input.postId !== undefined && (typeof input.postId !== "string" || !mongoose.isValidObjectId(input.postId))) ||
      (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 200)) ||
      (input.tags !== undefined &&
        (!Array.isArray(input.tags) ||
          input.tags.length > 10 ||
          input.tags.some((tag: unknown) => typeof tag !== "string" || tag.length > 50))) ||
      (input.customPrompt !== undefined &&
        (typeof input.customPrompt !== "string" || input.customPrompt.length > 2000))
    ) {
      return NextResponse.json({ success: false, error: "Invalid image generation input.", code: "INVALID_INPUT" }, { status: 400 });
    }
    const postId = typeof input.postId === "string" ? input.postId : undefined;
    const title = typeof input.title === "string" ? input.title : undefined;
    const tags = Array.isArray(input.tags) ? input.tags as string[] : undefined;
    const customPrompt = typeof input.customPrompt === "string" ? input.customPrompt : undefined;
    if ((!title || !title.trim()) && !postId) {
      return NextResponse.json(
        { success: false, error: "Either title or postId is required", code: "INVALID_INPUT" },
        { status: 400 }
      );
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
    const rl = await checkDistributedRateLimit(user.id || "admin", "image_generate");
    if (!rl.allowed) {
      const status = rl.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        {
          success: false,
          error: rl.isServiceUnavailable
            ? "Shared rate limiting service is temporarily unavailable. Request rejected to prevent quota abuse."
            : `Image generation rate limit reached. Please wait ${rl.retryAfterSeconds}s.`,
          code: rl.isServiceUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
        },
        { status }
      );
    }

    let postTitle = title || "";
    let postTags = tags || [];
    let post = null;

    if (postId) {
      post = await Post.findById(postId);
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const canEdit = user.role === "super_admin" || post.author?.toString() === user.id;
      if (!canEdit) {
        return NextResponse.json(
          { error: "Unauthorized: You can only update your own posts." },
          { status: 403 }
        );
      }
      postTitle = post.title;
      postTags = post.tags || [];
    }

    const imageUrl = await generateCoverImage({
      title: postTitle,
      tags: postTags,
      customPrompt,
    });

    if (post && imageUrl) {
      post.image = imageUrl;
      await post.save();

      await logAIStudioAction({
        action: "image_generated",
        actorType: "user",
        actorId: user.id,
        targetPostId: post._id,
        metadata: {
          actionDetail: "Cover image generated via AI Studio",
          newImageUrl: imageUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      postId: post?._id,
    });
  } catch (error: any) {
    if (error instanceof AIStudioDisabledError) {
      return NextResponse.json(
        { success: false, error: "AI Studio is currently disabled via Emergency Kill-Switch.", code: "KILL_SWITCH_ACTIVE" },
        { status: 503 },
      );
    }
    return safeErrorResponse(error, "Failed to generate cover image.", 500, "IMAGE_GENERATION_FAILED");
  }
}
