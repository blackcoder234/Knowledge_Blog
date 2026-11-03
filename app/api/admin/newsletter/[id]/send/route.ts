import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Newsletter, {
  NEWSLETTER_STALE_SEND_AFTER_MS,
} from "@/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

const DEFINITIVE_REJECTION_STATUSES = new Set([400, 401, 403, 404, 422, 429]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let providerOutcome: "not_attempted" | "unknown" | "accepted" | "rejected" = "not_attempted";
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    // Only Super Admin can blast emails
    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    await dbConnect();

    const apiKey = process.env.BUTTONDOWN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Newsletter sending is unavailable" },
        { status: 503 },
      );
    }

    const claimedAt = new Date();
    const newsletter = await Newsletter.findOneAndUpdate(
      { _id: id, status: { $in: ["draft", "scheduled"] } },
      { $set: { status: "sending", sendingAt: claimedAt } },
      { returnDocument: "after", runValidators: true },
    );

    if (!newsletter) {
      const current = await Newsletter.findById(id).select("status sendingAt");
      if (!current) {
        return NextResponse.json(
          { error: "Newsletter not found" },
          { status: 404 },
        );
      }

      if (current.status === "sending") {
        const stale =
          current.sendingAt &&
          Date.now() - current.sendingAt.getTime() >=
            NEWSLETTER_STALE_SEND_AFTER_MS;
        return NextResponse.json(
          {
            error: stale
              ? "Send outcome requires manual reconciliation. Do not retry until the provider confirms it was not sent."
              : "Newsletter is already being sent",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Newsletter cannot be sent in its current state" },
        { status: 409 },
      );
    }

    let response: Response;
    providerOutcome = "unknown";
    try {
      response = await fetch("https://api.buttondown.email/v1/emails", {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: newsletter.subject,
          body: newsletter.content,
          status: "sent",
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Send outcome is unknown. The newsletter was not automatically retried; reconcile the provider before retrying.",
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      if (DEFINITIVE_REJECTION_STATUSES.has(response.status)) {
        providerOutcome = "rejected";
        await Newsletter.findOneAndUpdate(
          { _id: id, status: "sending", sendingAt: claimedAt },
          {
            $set: { status: "draft" },
            $unset: { sendingAt: 1 },
          },
          { runValidators: true },
        );
        return NextResponse.json(
          { error: "Delivery was rejected. Review the newsletter before retrying." },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          error:
            "Send outcome is unknown. The newsletter was not automatically retried; reconcile the provider before retrying.",
        },
        { status: 502 },
      );
    }

    providerOutcome = "accepted";
    let providerId: string | undefined;
    try {
      const data = await response.json();
      if (typeof data?.id === "string") {
        providerId = data.id;
      }
    } catch {
      // A successful HTTP response confirms acceptance even if its body is unreadable.
    }

    const update: Record<string, unknown> = {
      status: "sent",
      sentAt: new Date(),
    };
    if (providerId) {
      update.providerId = providerId;
    }

    const recorded = await Newsletter.findOneAndUpdate(
      { _id: id, status: "sending", sendingAt: claimedAt },
      { $set: update, $unset: { sendingAt: 1 } },
      { returnDocument: "after", runValidators: true },
    );

    if (!recorded) {
      return NextResponse.json(
        {
          error:
            "The provider accepted the newsletter, but its outcome could not be recorded. Manual reconciliation is required.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter send request failed:", error);
    if (providerOutcome === "not_attempted") {
      return NextResponse.json(
        { error: "Unable to start newsletter sending." },
        { status: 500 },
      );
    }
    if (providerOutcome === "rejected") {
      return NextResponse.json(
        { error: "Provider rejected delivery, but the send state could not be updated. Manual review is required." },
        { status: 502 },
      );
    }
    if (providerOutcome === "accepted") {
      return NextResponse.json(
        { error: "The provider accepted the newsletter, but its outcome could not be recorded. Manual reconciliation is required." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Send outcome is unknown. The newsletter was not automatically retried; reconcile the provider before retrying.",
      },
      { status: 502 },
    );
  }
}
