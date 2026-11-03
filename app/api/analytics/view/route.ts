import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { checkDistributedRateLimit } from '@/lib/ai-studio/rateLimiter';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { getRequestClientKey } from '@/lib/requestClientKey';

export async function POST(request: Request) {
  try {
    const bodyResult = await readLimitedRequestText(request, 2048);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Request body too large.' : 'Request body is required.' },
        { status: tooLarge ? 413 : 400 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const slug = (body as { slug?: unknown }).slug;
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
      return NextResponse.json({ error: 'Invalid post slug.' }, { status: 400 });
    }

    const clientKey = getRequestClientKey(request, slug);
    if (!clientKey) {
      return NextResponse.json(
        { error: 'Analytics service is temporarily unavailable.' },
        { status: 503 },
      );
    }
    const rateLimit = await checkDistributedRateLimit(clientKey, 'tracking');
    if (!rateLimit.allowed) {
      const status = rateLimit.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? 'Analytics service is temporarily unavailable.' : 'Too many analytics requests.' },
        {
          status,
          headers: rateLimit.isServiceUnavailable
            ? undefined
            : { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();
    const post = await Post.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true, select: 'views' },
    );
    if (!post) return NextResponse.json({ error: 'Published post not found.' }, { status: 404 });

    return NextResponse.json({ success: true, views: post.views });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
