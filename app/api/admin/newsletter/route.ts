import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_NEWSLETTER_BODY_BYTES = 256 * 1024;

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

    const bodyResult = await readLimitedRequestText(req, MAX_NEWSLETTER_BODY_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Newsletter content exceeds the size limit." : "Request body is required." },
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
      return NextResponse.json({ error: "Invalid newsletter data." }, { status: 400 });
    }
    const { subject, content } = body as { subject?: unknown; content?: unknown };
    if (typeof subject !== "string" || !subject.trim() || subject.length > 200 ||
        (content !== undefined && typeof content !== "string")) {
      return NextResponse.json(
        { error: "A valid subject and text content are required." },
        { status: 400 },
      );
    }

    await dbConnect();

    const newsletter = await Newsletter.create({
      subject: subject.trim(),
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
