import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Newsletter, {
  NEWSLETTER_STALE_SEND_AFTER_MS,
} from "@/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";

const MAX_NEWSLETTER_BODY_BYTES = 256 * 1024;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const fields = Object.keys(input);
    if (
      fields.length === 1 &&
      fields[0] === "reconcileSend" &&
      input.reconcileSend === "provider_confirmed_not_sent"
    ) {
      await dbConnect();
      const newsletter = await Newsletter.findOneAndUpdate(
        {
          _id: id,
          status: "sending",
          sendingAt: {
            $lte: new Date(Date.now() - NEWSLETTER_STALE_SEND_AFTER_MS),
          },
          providerId: { $exists: false },
        },
        {
          $set: { status: "draft" },
          $unset: { sendingAt: 1 },
        },
        { returnDocument: "after", runValidators: true },
      );

      if (!newsletter) {
        const current = await Newsletter.findById(id).select("status");
        if (!current) {
          return NextResponse.json(
            { error: "Newsletter not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(
          {
            error:
              "Only a stale send with no recorded provider acceptance can be reconciled. Confirm with the provider before retrying.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ success: true, status: "draft" });
    }

    const allowedFields = new Set(["subject", "content"]);
    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.has(field)) ||
      fields.some((field) => typeof input[field] !== "string")
    ) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    await dbConnect();

    const newsletter = await Newsletter.findOneAndUpdate(
      { _id: id, status: { $nin: ["sending", "sent"] } },
      { $set: input },
      { returnDocument: "after", runValidators: true },
    );

    if (!newsletter) {
      const current = await Newsletter.findById(id).select("status");
      if (!current) {
        return NextResponse.json(
          { error: "Newsletter not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Newsletters cannot be changed while sending or after sent" },
        { status: 409 },
      );
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      return NextResponse.json({ error: "Invalid newsletter update" }, { status: 400 });
    }
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    await dbConnect();
    const deleted = await Newsletter.findOneAndDelete({
      _id: id,
      status: { $nin: ["sending", "sent"] },
    });

    if (!deleted) {
      const current = await Newsletter.findById(id).select("status");
      if (!current) {
        return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Newsletters cannot be deleted while sending or after sent" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
