import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import AIQualityReview from "@/models/AIQualityReview";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const drafts = await Post.find({
      status: "draft",
      isAiAssisted: true,
    })
      .populate("category", "name slug")
      .populate("author", "name email image")
      .sort({ createdAt: -1 })
      .lean();

    // Attach quality score if available
    const draftsWithReview = await Promise.all(
      drafts.map(async (d) => {
        const review = await AIQualityReview.findOne({ postId: d._id })
          .sort({ createdAt: -1 })
          .select("overallScore passed")
          .lean();
        return {
          ...d,
          qualityScore: review?.overallScore,
          passedQualityGate: review?.passed,
        };
      })
    );

    return NextResponse.json({ drafts: draftsWithReview });
  } catch (error: any) {
    console.error("Drafts API error:", error);
    return NextResponse.json({ error: "Unable to process AI Studio draft request." }, { status: 500 });
  }
}
