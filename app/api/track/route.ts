
import { NextResponse } from 'next/server';
import Visitor from '@/models/Visitor';
import PageView from '@/models/PageView';
import dbConnect from '@/lib/db';
import { UAParser } from 'ua-parser-js';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { path, referrer } = body;
    
    // 1. Ignore Admin Paths & API calls (except this one)
    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) {
        return NextResponse.json({ success: true, ignored: true });
    }

    // Extract User Agent Info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const browserName = result.browser.name || 'Unknown';
    const osName = result.os.name || 'Unknown';
    const deviceType = result.device.type || 'Desktop';

    // IP Extraction
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    // 2. Manage Unique Visitor (The "User")
    // "Total Users will be count on the '/' only" -> Use this logic for counting NEW visitors strictly?
    // Actually, widespread standard: Visitor is unique by IP.
    // We update the visitor record if it exists, otherwise create it.
    
    const existingVisitor = await Visitor.findOne({ ip });
    
    if (existingVisitor) {
        // returning visitor
        existingVisitor.lastSeen = new Date();
        existingVisitor.visitCount += 1;
        // Update device info in case they switched? Or keep first?
        // Let's keep first seen info, or maybe update latest? usually update latest.
        existingVisitor.browser = browserName;
        existingVisitor.os = osName;
        existingVisitor.device = deviceType;
        existingVisitor.path = path; // Update current path (for "Live" view)
        await existingVisitor.save();
    } else {
        // new visitor
        await Visitor.create({
            ip,
            country: 'Unknown', // Todo: GeoIP
            city: 'Unknown',
            browser: browserName,
            os: osName,
            device: deviceType,
            path,
            referrer: referrer || 'Direct',
            visitCount: 1
        });
    }

    // 3. Log Page View (The "Hit" for Charts)
    // We log this separately to allow "Views per Day" charts even if the user is unique
    await PageView.create({
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
