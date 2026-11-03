import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Published post not found." }, { status: 404 });
    }
    await dbConnect();

    const userId = (session.user as any).id;
    const [post, user] = await Promise.all([
      Post.findOne({ _id: id, status: "published" }).select("_id"),
      User.findById(userId).select("bookmarks"),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!post) {
      return NextResponse.json({ error: "Published post not found." }, { status: 404 });
    }

    const isBookmarked = user.bookmarks.some((postId: any) => postId.toString() === id);

    if (isBookmarked) {
      await User.updateOne({ _id: userId, bookmarks: post._id }, { $pull: { bookmarks: post._id } });
    } else {
      await User.updateOne({ _id: userId }, { $addToSet: { bookmarks: post._id } });
    }

    const updatedUser = await User.findById(userId).select("bookmarks");
    const isNowBookmarked = updatedUser?.bookmarks.some((postId: any) => postId.toString() === id) ?? false;
    return NextResponse.json(
      {
        isBookmarked: isNowBookmarked,
        message: isNowBookmarked ? "Bookmarked" : "Bookmark removed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
