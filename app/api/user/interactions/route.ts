import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const POST_FIELDS = "title slug excerpt image createdAt category";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (!["bookmarks", "liked", "ids"].includes(type || "")) {
    return NextResponse.json({ error: "Unsupported interaction type." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await dbConnect();
    const user = await User.findById(userId).select("bookmarks likedPosts");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const idsFor = async (ids: mongoose.Types.ObjectId[]) => {
      const posts = await Post.find({ _id: { $in: ids }, status: "published" })
        .select("_id")
        .lean();
      return posts.map((post) => post._id.toString());
    };

    if (type === "ids") {
      const [liked, bookmarked] = await Promise.all([
        idsFor(user.likedPosts),
        idsFor(user.bookmarks),
      ]);
      return NextResponse.json({ liked, bookmarked });
    }

    const ids = type === "bookmarks" ? user.bookmarks : user.likedPosts;
    const posts = await Post.find({ _id: { $in: ids }, status: "published" })
      .select(POST_FIELDS)
      .populate("category", "name")
      .lean();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch user interactions:", error);
    return NextResponse.json({ error: "Failed to fetch interactions." }, { status: 500 });
  }
}
