import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await dbConnect();
        await Comment.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Comment deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin' && (session.user as any).role !== 'editor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id, status } = await req.json();

        if (!id || !status) {
             return NextResponse.json({ error: 'ID and Status required' }, { status: 400 });
        }

        await dbConnect();
        // Validate status enum if strictness needed, but mongoose will handle enum validation error
        const updated = await Comment.findByIdAndUpdate(id, { status }, { new: true });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
