
import { NextResponse } from 'next/server';
import Visitor from '@/models/Visitor';
import PageView from '@/models/PageView';
import dbConnect from '@/lib/db';
import { UAParser } from 'ua-parser-js';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { path, referrer, visitorId } = body;
    
    // 1. Validate Input & Backwards Compatibility
    // If no visitorId provided (cached client), fallback to IP as ID
    const effectiveVisitorId = visitorId || (request.headers.get('x-forwarded-for') ? request.headers.get('x-forwarded-for')!.split(',')[0].trim() : '127.0.0.1');

    // 2. Ignore Admin Paths & API calls (except this one)
    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) {
        return NextResponse.json({ success: true, ignored: true });
    }

    // 3. User Agent Parsing
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const browserName = result.browser.name || 'Unknown';
    const osName = result.os.name || 'Unknown';
    const deviceType = result.device.type || 'Desktop';

    // 4. IP Extraction
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 5. Geolocation Resolution
    // Priority: Vercel Headers -> Unknown
    // We removed geoip-lite due to build issues with data file resolution in Next.js
    let country = request.headers.get('x-vercel-ip-country');
    let city = request.headers.get('x-vercel-ip-city');

    // Normalize
    country = country || 'Unknown';
    city = city || 'Unknown';
    
    // 6. Manage Unique Visitor (Atomic Upsert by Visitor ID)
    const updates: any = {
        $set: {
            lastSeen: new Date(),
            path,
            browser: browserName,
            os: osName,
            device: deviceType,
            country: country, // Always update geo in case they move/vpn
            city: city,
            ip: ip // Keep latest IP
        },
        $inc: { visitCount: 1 },
        $setOnInsert: { 
            createdAt: new Date(),
            referrer: referrer || 'Direct',
            visitorId: effectiveVisitorId 
        }
    };

    await Visitor.findOneAndUpdate(
        { visitorId: effectiveVisitorId }, 
        updates,
        { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true 
        }
    );

    // 7. Log Page View
    await PageView.create({
        visitorId: effectiveVisitorId,
        ip,
        path,
        createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error", error);
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
