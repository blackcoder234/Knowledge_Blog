import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";
import { checkDistributedRateLimit } from "@/lib/ai-studio/rateLimiter";
import { getRequestClientKey } from "@/lib/requestClientKey";

export async function POST(req: Request) {
  try {
    const bodyResult = await readLimitedRequestText(req, 8 * 1024);
    if ("error" in bodyResult) {
      const tooLarge = bodyResult.error === "too_large";
      return NextResponse.json(
        { error: tooLarge ? "Contact form exceeds the 8 KB limit." : "Request body is required." },
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
      return NextResponse.json({ error: "Invalid contact form data." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
    const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const subject = typeof input.subject === "string" ? input.subject.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";

    if (
      !firstName ||
      firstName.length > 80 ||
      !lastName ||
      lastName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !subject ||
      subject.length > 150 ||
      !message ||
      message.length > 4000
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const clientKey = getRequestClientKey(req, email);
    if (!clientKey) {
      return NextResponse.json(
        { error: "Contact service is temporarily unavailable." },
        { status: 503 },
      );
    }
    const rateLimit = await checkDistributedRateLimit(clientKey, "contact");
    if (!rateLimit.allowed) {
      const status = rateLimit.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? "Contact service is temporarily unavailable." : "Too many contact submissions. Try again later." },
        {
          status,
          headers: rateLimit.isServiceUnavailable
            ? undefined
            : { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();

    const newContact = await Contact.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    return NextResponse.json({ message: "Message sent successfully", contact: newContact }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();
        const contacts = await Contact.find().sort({ createdAt: -1 });
        return NextResponse.json(contacts);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
