import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from 'mongoose';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin' && (session.user as any).role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch comments with populated Author (name/image) and Post (title)
    const comments = await Comment.find({})
      .populate('author', 'name image email') // fields to select
      .populate('post', 'title slug')
      .sort({ createdAt: -1 });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin' && (session.user as any).role !== 'editor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id || !mongoose.isValidObjectId(id)) {
          return NextResponse.json({ error: 'Valid comment ID required' }, { status: 400 });
        }

        await dbConnect();
        const deleted = await Comment.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

        return NextResponse.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Failed to delete comment:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin' && (session.user as any).role !== 'editor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const bodyResult = await readLimitedRequestText(req, 4096);
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
          return NextResponse.json({ error: 'Invalid comment update.' }, { status: 400 });
        }
        const { id, status } = body as { id?: unknown; status?: unknown };
        if (typeof id !== 'string' || !mongoose.isValidObjectId(id) ||
            typeof status !== 'string' || !['pending', 'approved', 'rejected'].includes(status)) {
          return NextResponse.json({ error: 'Valid comment ID and status are required.' }, { status: 400 });
        }

        await dbConnect();
        const updated = await Comment.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update comment:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
