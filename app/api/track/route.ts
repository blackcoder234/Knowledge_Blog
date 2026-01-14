import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visitor from '@/models/Visitor';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { path, visitorId } = body;

    // Anonymize IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex').substring(0, 16);
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Simple country detection (if hosted on Vercel/Netlify, they provide headers)
    const country = req.headers.get('x-vercel-ip-country') || 'unknown';

    await Visitor.create({
      visitorId,
      ipHash,
      userAgent,
      path,
      country
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
