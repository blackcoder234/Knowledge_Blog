import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Post from '@/models/Post';
import Setting from '@/models/Setting';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { checkDistributedRateLimit } from '@/lib/ai-studio/rateLimiter';
import mongoose from 'mongoose';

// GET Comments for a Post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId || !mongoose.isValidObjectId(postId)) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await dbConnect();
    const post = await Post.findOne({ _id: postId, status: 'published' }).select('_id');
    if (!post) {
      return NextResponse.json({ error: 'Published post not found' }, { status: 404 });
    }

    const comments = await Comment.find({ post: postId, status: 'approved' })
                                  .populate('author', 'name image role')
                                  .sort({ createdAt: -1 });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 });
  }
}

// POST New Comment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readLimitedRequestText(req, 8 * 1024);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Comment request exceeds the 8 KB limit.' : 'Request body is required.' },
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
    const { content, postId } = body as { content?: unknown; postId?: unknown };
    if (
      typeof content !== 'string' ||
      !content.trim() ||
      content.length > 3000 ||
      typeof postId !== 'string' ||
      !mongoose.isValidObjectId(postId)
    ) {
      return NextResponse.json({ error: 'Enter a comment of at most 3,000 characters and a valid post ID.' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const rateLimit = await checkDistributedRateLimit(userId, 'comments');
    if (!rateLimit.allowed) {
      const status = rateLimit.isServiceUnavailable ? 503 : 429;
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? 'Commenting is temporarily unavailable.' : 'Too many comments. Try again later.' },
        {
          status,
          headers: rateLimit.isServiceUnavailable
            ? undefined
            : { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    await dbConnect();

    // 1. Check Global Comments Toggle
    const commSetting = await Setting.findOne({ key: 'comments_enabled' });
    if (commSetting && commSetting.value === false) {
        return NextResponse.json({ error: 'Comments are globally disabled' }, { status: 403 });
    }

    // 2. Check Post Existence & Auto-Close Days
    const post = await Post.findOne({ _id: postId, status: 'published' });
    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const ageSetting = await Setting.findOne({ key: 'auto_close_days' });
    const autoCloseDays = parseInt(ageSetting?.value || "0");

    if (autoCloseDays > 0) {
        const postDate = new Date(post.createdAt);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > autoCloseDays) {
            return NextResponse.json({ error: 'Comments on this post are closed' }, { status: 403 });
        }
    }
    
    const newComment = await Comment.create({
        content: content.trim(),
        post: postId,
        author: userId
    });
    
    // Populate author for immediate return
    await newComment.populate('author', 'name image role');

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment.' }, { status: 500 });
  }
}
