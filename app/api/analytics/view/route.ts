import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import PageView from '@/models/PageView';

export async function POST(request: Request) {
  try {
    const { slug } = await request.json();
    
    if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Find the post
    const post = await Post.findOne({ slug });
    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 2. Increment View Count on Post (Atomic)
    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    // 3. (Removed) PageView logging is handled globally by ClientTracker/VisitorTracker
    // We only need to increment the public-facing view count here.


    return NextResponse.json({ success: true, views: post.views + 1 });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
