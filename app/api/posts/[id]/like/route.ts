import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import GuestPostLike from "@/models/GuestPostLike";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";
import { checkDistributedRateLimit } from "@/lib/ai-studio/rateLimiter";
import { getRequestClientKey } from "@/lib/requestClientKey";
import { getGuestLikeIdentity, GUEST_LIKE_COOKIE } from "@/lib/guestLikeIdentity";

const MAX_LIKE_BODY_BYTES = 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const bodyResult = await readLimitedRequestText(request, MAX_LIKE_BODY_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Request body is too large." : "Request body is required." },
        { status: tooLarge ? 413 : 400 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid like action." }, { status: 400 });
    }
    const action = (body as { action?: unknown }).action;
    if (action !== "like" && action !== "unlike") {
      return NextResponse.json({ error: "Action must be like or unlike." }, { status: 400 });
    }

    await dbConnect();
    const session = await getServerSession(authOptions);
    let guestIdentity: ReturnType<typeof getGuestLikeIdentity> = null;
    if (!session) {
      guestIdentity = getGuestLikeIdentity(request);
      if (!guestIdentity) {
        return NextResponse.json({ error: "Like service is unavailable." }, { status: 503 });
      }
      const clientKey = getRequestClientKey(request, guestIdentity.visitorHash);
      if (!clientKey) {
        return NextResponse.json({ error: "Like service is unavailable." }, { status: 503 });
      }
      const limit = await checkDistributedRateLimit(
        clientKey,
        "tracking",
      );
      if (!limit.allowed) {
        const status = limit.isServiceUnavailable ? 503 : 429;
        return NextResponse.json(
          { error: limit.isServiceUnavailable ? "Like service is unavailable." : "Too many like requests." },
          {
            status,
            headers: limit.isServiceUnavailable
              ? undefined
              : { "Retry-After": String(limit.retryAfterSeconds) },
          },
        );
      }
    }

    let result: { likes: number; hasLiked: boolean } | undefined;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        const post = await Post.findOne({ _id: id, status: "published" })
          .select("likes")
          .session(dbSession);
        if (!post) throw new Error("PUBLISHED_POST_NOT_FOUND");

        let changed = false;
        let hasLiked = false;

        if (session) {
          const userId = (session.user as { id?: string } | undefined)?.id;
          if (!userId || !mongoose.isValidObjectId(userId)) {
            throw new Error("AUTHENTICATED_USER_NOT_FOUND");
          }
          const user = await User.findById(userId).select("likedPosts").session(dbSession);
          if (!user) throw new Error("AUTHENTICATED_USER_NOT_FOUND");

          hasLiked = user.likedPosts.some((postId: mongoose.Types.ObjectId) => postId.toString() === id);
          const shouldLike = action === "like";
          if (hasLiked !== shouldLike) {
            const update = shouldLike
              ? { $addToSet: { likedPosts: post._id } }
              : { $pull: { likedPosts: post._id } };
            const updated = await User.updateOne({ _id: userId }, update, { session: dbSession });
            changed = updated.modifiedCount === 1;
            hasLiked = shouldLike;
          }
        } else if (guestIdentity) {
          const existing = await GuestPostLike.findOne({
            postId: post._id,
            visitorHash: guestIdentity.visitorHash,
          }).session(dbSession);
          const shouldLike = action === "like";
          if (shouldLike && !existing) {
            await GuestPostLike.create(
              [{ postId: post._id, visitorHash: guestIdentity.visitorHash }],
              { session: dbSession },
            );
            changed = true;
          } else if (!shouldLike && existing) {
            const deleted = await GuestPostLike.deleteOne({ _id: existing._id }, { session: dbSession });
            changed = deleted.deletedCount === 1;
          }
          hasLiked = shouldLike;
        }

        if (changed) {
          const likes = (post.likes ?? 0) + (action === "like" ? 1 : -1);
          if (likes < 0) throw new Error("LIKE_COUNT_INVARIANT_FAILED");
          await Post.updateOne(
            { _id: post._id, status: "published" },
            { $set: { likes } },
            { session: dbSession },
          );
          post.likes = likes;
        }

        result = { likes: post.likes ?? 0, hasLiked };
      });
    } finally {
      await dbSession.endSession();
    }

    if (!result) throw new Error("Like transaction returned no result.");
    const response = NextResponse.json(result);
    if (guestIdentity?.cookieValue) {
      response.cookies.set(GUEST_LIKE_COOKIE, guestIdentity.cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "PUBLISHED_POST_NOT_FOUND") {
      return NextResponse.json({ error: "Published post not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "AUTHENTICATED_USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    console.error("Error toggling post like:", error);
    return NextResponse.json({ error: "Unable to update like." }, { status: 500 });
  }
}
