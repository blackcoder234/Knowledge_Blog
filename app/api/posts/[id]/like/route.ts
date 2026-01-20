import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    await dbConnect();

    const userId = (session.user as any).id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already liked the post
    // Note: Assuming likedPosts is an array of ObjectIds. 
    // We use .some() or .includes() but with ObjectIds sometimes string comparison is safer.
    const hasLiked = user.likedPosts.some((postId: any) => postId.toString() === id);

    let post;
    if (hasLiked) {
      // Unlike
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: id } });
      post = await Post.findByIdAndUpdate(
        id,
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      // Like
      await User.findByIdAndUpdate(userId, { $addToSet: { likedPosts: id } });
      post = await Post.findByIdAndUpdate(
        id,
        { $inc: { likes: 1 } },
        { new: true }
      );
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        likes: post.likes,
        hasLiked: !hasLiked,
        message: hasLiked ? "Unliked" : "Liked",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
