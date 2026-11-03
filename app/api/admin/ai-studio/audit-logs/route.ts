import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIAuditLog from "@/models/AIAuditLog";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    await dbConnect();

    const [logs, totalCount] = await Promise.all([
      AIAuditLog.find()
        .populate("actorId", "name email role image")
        .populate("targetPostId", "title slug status")
        .populate("targetOpportunityId", "proposedTitle")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIAuditLog.countDocuments(),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("AI Studio audit log request failed:", error);
    return NextResponse.json({ error: "Unable to load audit logs." }, { status: 500 });
  }
}
