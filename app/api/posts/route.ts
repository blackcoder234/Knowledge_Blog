import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    // Authorization Check: Must be editor, admin, or super_admin
    const allowedRoles = ['editor', 'admin', 'super_admin'];
    if (!session || !allowedRoles.includes(user?.role)) {
        return NextResponse.json({ error: 'Unauthorized: You must be an Editor or Admin to create posts' }, { status: 403 });
    }

    const body = await request.json();
    await dbConnect();

    // Validation based on Status
    if (!body.title || !body.slug) {
        return NextResponse.json({ error: 'Title and Slug are required, even for drafts.' }, { status: 400 });
    }

    if (body.status === 'published') {
        if (!body.excerpt || !body.content || !body.image) {
             return NextResponse.json({ error: 'Published posts require Content, Excerpt, and a Featured Image.' }, { status: 400 });
        }
    }

    if (body.status === 'scheduled') {
        if (!body.scheduledPublishDate) {
             return NextResponse.json({ error: 'Scheduled posts require a date.' }, { status: 400 });
        }
        // Scheduled posts must be valid enough to publish automatically later,
        // so we enforce the same rules as 'published' usually.
        if (!body.excerpt || !body.content || !body.image) {
             return NextResponse.json({ error: 'Scheduled posts require Content, Excerpt, and a Featured Image (to be ready for auto-publish).' }, { status: 400 });
        }
    }

    // Use Real User ID for Reference
    // Super Admin can assign author, otherwise defaults to current user
    const authorId = (user.role === 'super_admin' && body.author) 
        ? body.author 
        : user.id;
    
    // Calculate read time
    let plainText = "";
    if (body.contentJson) {
        // Extract text from JSON
        const getText = (node: any): string => {
            if (node.type === 'text') return node.text || '';
            if (node.content && Array.isArray(node.content)) {
                return node.content.map(getText).join(' ');
            }
            return '';
        };
        plainText = getText(body.contentJson);
    } else if (body.content) {
        // Fallback: Strip HTML
        plainText = body.content.replace(/<[^>]*>/g, ' ');
    }

    const words = plainText.trim().split(/\s+/).length;
    const readTimeVal = words > 0
        ? `${Math.ceil(words / 200)} min read`
        : '1 min read';

    const newPost = await Post.create({
        ...body,
        author: authorId,
        readTime: readTimeVal
    });

    // BUST CACHE
    revalidatePath("/admin/posts");
    revalidatePath("/");

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    // Handle duplicate slug error
    if (error.code === 11000) {
        return NextResponse.json({ error: 'Slug must be unique' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
