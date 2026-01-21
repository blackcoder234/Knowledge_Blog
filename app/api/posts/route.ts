import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Use Real User Data
    const author = {
        name: user.name || "Anonymous Editor",
        email: user.email || "unknown@example.com", // Store email for permissions
        role: user.role === 'super_admin' ? 'Super Admin' : (user.role === 'admin' ? 'Administrator' : 'Editor'),
        image: user.image || "https://placehold.co/100x100/333/FFF?text=User"
    };
    
    // Calculate read time if content exists, otherwise default
    const readTimeVal = body.content 
        ? `${Math.ceil(body.content.split(/\s+/).length / 200)} min read`
        : '1 min read';

    const newPost = await Post.create({
        ...body,
        author,
        readTime: readTimeVal
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    // Handle duplicate slug error
    if (error.code === 11000) {
        return NextResponse.json({ error: 'Slug must be unique' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
