
import { NextResponse } from 'next/server';
import Visitor from '@/models/Visitor';
import PageView from '@/models/PageView';
import dbConnect from '@/lib/db';
import { UAParser } from 'ua-parser-js';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { checkDistributedRateLimit } from '@/lib/ai-studio/rateLimiter';
import { getRequestClientKey } from '@/lib/requestClientKey';
import { getTrustedClientIp } from '@/lib/trustedClientIp';
import { randomUUID } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const bodyResult = await readLimitedRequestText(request, 4096);
    if ('error' in bodyResult) {
      if (bodyResult.error === 'too_large') {
        return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      }
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid tracking data' }, { status: 400 });
    }

    const { path, referrer, visitorId } = body;

    if (
      typeof path !== 'string' ||
      path.length > 2048 ||
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[\u0000-\u001f]/.test(path)
    ) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    if (
      (visitorId !== undefined &&
        (typeof visitorId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId))) ||
      (referrer !== undefined && (typeof referrer !== 'string' || referrer.length > 2048))
    ) {
      return NextResponse.json({ error: 'Invalid tracking data' }, { status: 400 });
    }

    const ip = getTrustedClientIp(request.headers) || 'Unknown';
    const effectiveVisitorId =
      typeof visitorId === 'string' ? visitorId : randomUUID();

    // 2. Ignore Admin Paths & API calls (except this one)
    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) {
        return NextResponse.json({ success: true, ignored: true });
    }

    const clientKey = getRequestClientKey(request, effectiveVisitorId);
    if (!clientKey) {
      return NextResponse.json({ success: true, ignored: true });
    }
    const rateLimit = await checkDistributedRateLimit(clientKey, 'tracking');
    if (!rateLimit.allowed) {
      const status = rateLimit.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? 'Analytics service is temporarily unavailable.' : 'Too many tracking requests.' },
        {
          status,
          headers: rateLimit.isServiceUnavailable
            ? undefined
            : { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();

    // 3. User Agent Parsing
    const userAgent = (request.headers.get('user-agent') || 'Unknown').slice(0, 512);
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const browserName = result.browser.name || 'Unknown';
    const osName = result.os.name || 'Unknown';
    const deviceType = result.device.type || 'Desktop';

    // 5. Geolocation Resolution
    // Priority: Vercel Headers -> Unknown
    // We removed geoip-lite due to build issues with data file resolution in Next.js
    let country = request.headers.get('x-vercel-ip-country');
    let city = request.headers.get('x-vercel-ip-city');

    // Normalize
    country = country?.slice(0, 100) || 'Unknown';
    city = city?.slice(0, 100) || 'Unknown';
    
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
            referrer: typeof referrer === 'string' && referrer ? referrer : 'Direct',
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
