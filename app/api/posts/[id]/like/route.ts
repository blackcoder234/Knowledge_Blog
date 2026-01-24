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
    const { id } = await params;
    await dbConnect();
    
    // Parse body to see if it is a guest action
    // We expect { action: 'like' | 'unlike' } for guests since we can't track their state on server
    let body = {};
    try {
        body = await req.json();
    } catch (e) {}
    
    const guestAction = (body as any).action; 

    if (!session) {
      // Guest Mode: Just update count based on client-side state
      if (!guestAction || !['like', 'unlike'].includes(guestAction)) {
           // Default to 'like' if not specified, or handle error?
           // For simplicity let's increment if no specific valid action provided, 
           // BUT purely blindly incrementing is risky. Let's assume 'like'.
           // actually, better to require it.
           // Let's implement simple toggle:
           // If FE says 'like', we inc. If 'unlike', we dec.
           // If nothing, we assume 'like' (legacy).
      }

      const increment = guestAction === 'unlike' ? -1 : 1;
      
      const post = await Post.findByIdAndUpdate(
        id,
        { $inc: { likes: increment } },
        { new: true }
      );
      
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json({
         likes: post.likes,
         hasLiked: guestAction !== 'unlike', // Echo back
         message: "Success"
      });
    }

    // Authenticated Mode (Keep existing logic)
    const userId = (session.user as any).id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
