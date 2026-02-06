import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
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
