import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { checkDistributedRateLimit } from '@/lib/ai-studio/rateLimiter';
import { getRequestClientKey } from '@/lib/requestClientKey';

export async function POST(req: Request) {
  try {
    const bodyResult = await readLimitedRequestText(req, 2048);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Subscription request too large.' : 'Request body is required.' },
        { status: tooLarge ? 413 : 400 },
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const rawEmail = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as { email?: unknown }).email
      : undefined;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const clientKey = getRequestClientKey(req, email);
    if (!clientKey) {
      return NextResponse.json(
        { error: 'Subscription service is temporarily unavailable.' },
        { status: 503 },
      );
    }
    const rateLimit = await checkDistributedRateLimit(clientKey, 'subscribe');
    if (!rateLimit.allowed) {
      const status = rateLimit.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? 'Subscription service is temporarily unavailable.' : 'Too many subscription attempts. Try again later.' },
        {
          status,
          headers: rateLimit.isServiceUnavailable
            ? undefined
            : { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email });
    if (existing) {
        return NextResponse.json({ message: "Already subscribed!" }, { status: 200 });
    }

    await Subscriber.create({ email });

    // ----------------------------------------------------------------------
    // HYBRID SYNC: Push to Buttondown (External Provider)
    // ----------------------------------------------------------------------
    const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
    if (BUTTONDOWN_API_KEY) {
      try {
        const buttondownRes = await fetch("https://api.buttondown.email/v1/subscribers", {
          method: "POST",
          headers: {
            "Authorization": `Token ${BUTTONDOWN_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!buttondownRes.ok) {
           const bdError = await buttondownRes.json();
           console.error("Buttondown Sync Failed:", bdError);
           // We do NOT throw here. We want the user to succeed even if external sync fails.
        }
      } catch (bdErr) {
        console.error("Buttondown Network Error:", bdErr);
      }
    }

    return NextResponse.json({ message: "Successfully subscribed!", success: true }, { status: 201 });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
