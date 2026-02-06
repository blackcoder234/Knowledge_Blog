import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const newsletters = await Newsletter.find().sort({ createdAt: -1 });
    return NextResponse.json(newsletters);
  } catch (error) {
    console.error("Failed to fetch newsletters:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { subject, content } = await req.json();

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const newsletter = await Newsletter.create({
      subject,
      content: content || "",
      status: "draft",
    });

    return NextResponse.json(newsletter, { status: 201 });
  } catch (error) {
    console.error("Failed to create newsletter:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
