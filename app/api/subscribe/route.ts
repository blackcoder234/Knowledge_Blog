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

    return NextResponse.json({ message: "Successfully subscribed!", success: true }, { status: 201 });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
