import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIContentOpportunity from "@/models/AIContentOpportunity";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_REQUEST_BYTES = 16 * 1024;
const MANUAL_OPPORTUNITY_STATUSES = [
  "new",
  "approved",
  "dismissed",
];
const WRITABLE_FIELDS = ["status", "proposedTitle", "tags", "targetReader", "whyItMattersNow"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid opportunity ID." }, { status: 400 });
    }

    const bodyResult = await readLimitedRequestText(request, MAX_REQUEST_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Request body exceeds the 16 KB limit." : "Request body is required." },
        { status: tooLarge ? 413 : 400 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    if (Object.keys(input).some((key) => !WRITABLE_FIELDS.includes(key))) {
      return NextResponse.json({ error: "Request contains unsupported opportunity fields." }, { status: 400 });
    }
    if (Object.keys(input).length === 0) {
      return NextResponse.json({ error: "At least one opportunity field is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    for (const key of ["proposedTitle", "targetReader", "whyItMattersNow"] as const) {
      const value = input[key];
      if (value !== undefined) {
        const maxLength = key === "whyItMattersNow" ? 5000 : 500;
        if (typeof value !== "string" || value.length > maxLength ||
            (key !== "targetReader" && !value.trim())) {
          return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
        }
        updateData[key] = value.trim();
      }
    }
    if (input.tags !== undefined) {
      if (!Array.isArray(input.tags) || input.tags.length > 30 ||
          input.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 50)) {
        return NextResponse.json({ error: "Tags must be an array of at most 30 non-empty strings (50 characters max)." }, { status: 400 });
      }
      updateData.tags = input.tags.map((tag) => (tag as string).trim());
    }
    if (input.status !== undefined) {
      if (typeof input.status !== "string" || !MANUAL_OPPORTUNITY_STATUSES.includes(input.status)) {
        return NextResponse.json({ error: "Invalid manually editable opportunity status." }, { status: 400 });
      }
      updateData.status = input.status;
    }

    await dbConnect();
    const updated = await AIContentOpportunity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("AI Studio opportunity update failed:", error);
    return NextResponse.json({ error: "Unable to update opportunity." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid opportunity ID." }, { status: 400 });
    }
    await dbConnect();

    const deleted = await AIContentOpportunity.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Opportunity deleted" });
  } catch (error) {
    console.error("AI Studio opportunity deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete opportunity." }, { status: 500 });
  }
}
