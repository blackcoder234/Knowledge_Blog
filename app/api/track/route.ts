
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
    
    // 2. Manage Unique Visitor (Atomic Upsert)
    // We use findOneAndUpdate to atomically update the visitor or create them if they don't exist.
    // This prevents race conditions where two parallel requests might both see "visitCount: 1" and update to 2.
    
    // Define the update operation
    const updates: any = {
        $set: {
            lastSeen: new Date(),
            path, // Update current path
            // Update device info to simple keep it fresh (or keep original? usually fresh is better for active users)
            browser: browserName,
            os: osName,
            device: deviceType,
        },
        $inc: { visitCount: 1 },
        $setOnInsert: { // Fields to set ONLY on creation
            createdAt: new Date(),
            country: 'Unknown', // Todo: GeoIP
            city: 'Unknown',
            referrer: referrer || 'Direct',
            ip: ip // Ensure IP is set on insert
        }
    };

    const visitor = await Visitor.findOneAndUpdate(
        { ip }, 
        updates,
        { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true 
        }
    );

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
