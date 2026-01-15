import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { likes: post.likes, message: "Post liked" },
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
