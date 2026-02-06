import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    // Only Super Admin can blast emails
    if (!session || userRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 },
      );
    }

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { error: "Newsletter already sent" },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // SEND VIA BUTTONDOWN
    // ------------------------------------------------------------------
    const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;

    if (!BUTTONDOWN_API_KEY) {
      return NextResponse.json(
        { error: "Buttondown API Key missing via .env" },
        { status: 500 },
      );
    }

    // Buttondown API: Create and Send Email
    // https://docs.buttondown.email/api/emails-create
    const response = await fetch("https://api.buttondown.email/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: newsletter.subject,
        body: newsletter.content,
        status: "sent", // Immediately send
        // optional: email_type: "public"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Buttondown Send Error:", errorData);
      return NextResponse.json(
        { error: "Failed to send via Buttondown", details: errorData },
        { status: 502 },
      );
    }

    const data = await response.json();

    // ------------------------------------------------------------------
    // UPDATE LOCAL STATUS
    // ------------------------------------------------------------------
    newsletter.status = "sent";
    newsletter.sentAt = new Date();
    newsletter.providerId = data.id; // Buttondown ID
    await newsletter.save();

    return NextResponse.json({ success: true, providerId: data.id });
  } catch (error) {
    console.error("Send Newsletter Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
