import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIResearchSource from "@/models/AIResearchSource";
import AIResearchItem from "@/models/AIResearchItem";
import mongoose from "mongoose";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_SOURCE_REQUEST_BYTES = 16 * 1024;

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
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    const bodyResult = await readLimitedRequestText(request, MAX_SOURCE_REQUEST_BYTES);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Research source request exceeds the 16 KB limit." : "Request body is required." },
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
      return NextResponse.json({ error: "Invalid research source update." }, { status: 400 });
    }

    await dbConnect();

    const input = body as Record<string, unknown>;
    const allowed = new Set(["active", "name", "publisher", "trustTier", "fetchIntervalMinutes", "category"]);
    if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !allowed.has(key))) {
      return NextResponse.json({ error: "Unsupported research source update." }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    const unsetData: Record<string, ""> = {};
    for (const key of ["name", "publisher"] as const) {
      const value = input[key];
      if (value !== undefined) {
        const maxLength = key === "name" ? 120 : 200;
        if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
          return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
        }
        updateData[key] = value.trim();
      }
    }
    if (input.active !== undefined) {
      if (typeof input.active !== "boolean") {
        return NextResponse.json({ error: "Active must be a boolean." }, { status: 400 });
      }
      updateData.active = input.active;
    }
    if (input.trustTier !== undefined) {
      if (typeof input.trustTier !== "string" ||
          !["verified", "primary", "secondary"].includes(input.trustTier)) {
        return NextResponse.json({ error: "Invalid trust tier." }, { status: 400 });
      }
      updateData.trustTier = input.trustTier;
    }
    if (input.fetchIntervalMinutes !== undefined) {
      if (typeof input.fetchIntervalMinutes !== "number" || !Number.isInteger(input.fetchIntervalMinutes) ||
          input.fetchIntervalMinutes < 15 || input.fetchIntervalMinutes > 10080) {
        return NextResponse.json({ error: "Fetch interval must be between 15 and 10,080 minutes." }, { status: 400 });
      }
      updateData.fetchIntervalMinutes = input.fetchIntervalMinutes;
    }
    if (input.category !== undefined) {
      if (input.category !== null &&
          (typeof input.category !== "string" || !mongoose.isValidObjectId(input.category))) {
        return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      }
      if (input.category === null) {
        unsetData.category = "";
      } else {
        updateData.category = input.category;
      }
    }

    const update: Record<string, Record<string, unknown>> = {};
    if (Object.keys(updateData).length > 0) update.$set = updateData;
    if (Object.keys(unsetData).length > 0) update.$unset = unsetData;

    const updated = await AIResearchSource.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("AI Studio research source update failed:", error);
    return NextResponse.json({ error: "Unable to update research source." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // Super Admin only for deletion
    if (!session || user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin access required to delete sources." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    await dbConnect();

    const deleted = await AIResearchSource.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Source not found" }, { status: 404 });
    await AIResearchItem.deleteMany({ sourceId: id });

    return NextResponse.json({ success: true, message: "Source and related items deleted." });
  } catch (error) {
    console.error("AI Studio research source deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete research source." }, { status: 500 });
  }
}
