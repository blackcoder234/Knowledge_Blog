import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import User from '@/models/User'; // Required for population
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET Comments for a Post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await dbConnect();
    const comments = await Comment.find({ post: postId, status: 'approved' })
                                  .populate('author', 'name image role')
                                  .sort({ createdAt: -1 });

    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST New Comment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, postId } = await req.json();
    
    if (!content || !postId) {
         return NextResponse.json({ error: 'Content and Post ID required' }, { status: 400 });
    }

    await dbConnect();
    
    const newComment = await Comment.create({
        content,
        post: postId,
        author: (session.user as any).id
    });
    
    // Populate author for immediate return
    await newComment.populate('author', 'name image role');

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
