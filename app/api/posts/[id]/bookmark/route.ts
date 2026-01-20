import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

    const isBookmarked = user.bookmarks.some((postId: any) => postId.toString() === id);

    if (isBookmarked) {
      // Remove bookmark
      await User.findByIdAndUpdate(userId, { $pull: { bookmarks: id } });
    } else {
      // Add bookmark
      await User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: id } });
    }

    return NextResponse.json(
      {
        isBookmarked: !isBookmarked,
        message: isBookmarked ? "Bookmark removed" : "Bookmarked",
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
