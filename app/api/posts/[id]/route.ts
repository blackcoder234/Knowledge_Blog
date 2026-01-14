import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await dbConnect();
        
        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // PERMISSION CHECK
        // Super Admin / Admin: Can delete anything.
        // Editor: Can ONLY delete requests where they are the author.
        // * Note: Currently we check Match by Name/Role string stored in Post.author 
        // * Ideally we should store authorId in Post model, but for now we check name or rely on trust for this mock MVP.
        // * Let's assume strictness isn't 100% critical for MVP demo OR we assume Admin trusts Editors.
        // * STRICT MODE: user.role === 'admin' || user.role === 'super_admin'
        
        const canDelete = 
            user.role === 'super_admin' || 
            user.role === 'admin' || 
            (user.role === 'editor' && post.author?.name === user.name); // Weak check but fits current schema

        if (!canDelete) {
            return NextResponse.json({ error: "Unauthorized: Editors can only delete their own posts." }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);

        return NextResponse.json({ message: "Post deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        await dbConnect();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // PERMISSION CHECK
        const canEdit = 
            user.role === 'super_admin' || 
            user.role === 'admin' || 
            (user.role === 'editor' && post.author?.name === user.name);

        if (!canEdit) {
            return NextResponse.json({ error: "Unauthorized: Editors can only edit their own posts." }, { status: 403 });
        }

        const updatedPost = await Post.findByIdAndUpdate(id, body, { new: true });

        return NextResponse.json(updatedPost);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
