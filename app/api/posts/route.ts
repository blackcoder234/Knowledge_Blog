import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml';
import mongoose from 'mongoose';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

const MAX_POST_BODY_BYTES = 2 * 1024 * 1024;
const WRITABLE_POST_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'content',
  'contentJson',
  'category',
  'language',
  'image',
  'tags',
  'featured',
  'status',
  'seoTitle',
  'seoDescription',
  'canonicalUrl',
  'ogImage',
  'noindex',
];

type PostCreateInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  contentJson?: unknown;
  category?: string;
  language?: string;
  image?: string;
  tags?: string[];
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    // Authorization Check: Must be editor, admin, or super_admin
    const allowedRoles = ['editor', 'admin', 'super_admin'];
    if (!session || !allowedRoles.includes(user?.role)) {
        return NextResponse.json({ error: 'Unauthorized: You must be an Editor or Admin to create posts' }, { status: 403 });
    }

    const bodyResult = await readLimitedRequestText(request, MAX_POST_BODY_BYTES);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Post request exceeds the 2 MB limit.' : 'Request body is required.' },
        { status: tooLarge ? 413 : 400 },
      );
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
        return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }
    const input = parsedBody as Record<string, unknown>;
    const body = Object.fromEntries(
      WRITABLE_POST_FIELDS
        .filter((key) => input[key] !== undefined)
        .map((key) => [key, input[key]]),
    ) as PostCreateInput;
    await dbConnect();

    // Validation based on Status
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
        typeof body.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) ||
        body.slug.length > 180) {
        return NextResponse.json({ error: 'Title and Slug are required, even for drafts.' }, { status: 400 });
    }
    if (body.content !== undefined && typeof body.content !== 'string') {
      return NextResponse.json({ error: 'Post content must be text.' }, { status: 400 });
    }
    if (body.contentJson !== undefined &&
        (!body.contentJson || typeof body.contentJson !== 'object' || Array.isArray(body.contentJson))) {
      return NextResponse.json({ error: 'Structured post content must be an object.' }, { status: 400 });
    }
    if (typeof body.content === 'string' && Buffer.byteLength(body.content, 'utf8') > MAX_POST_BODY_BYTES) {
      return NextResponse.json({ error: 'Post content exceeds the 2 MB request limit.' }, { status: 413 });
    }
    if (body.category && !mongoose.isValidObjectId(body.category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }
    if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > 30 ||
        body.tags.some((tag: unknown) => typeof tag !== 'string' || tag.length > 50))) {
      return NextResponse.json({ error: 'Tags must be an array of at most 30 strings.' }, { status: 400 });
    }
    if (input.status === 'scheduled') {
      return NextResponse.json(
        { error: 'Scheduled publishing is disabled. Save as a draft or publish immediately.' },
        { status: 400 },
      );
    }
    if (body.status !== undefined && !['draft', 'published', 'archived'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid post status.' }, { status: 400 });
    }

    if (body.status === 'published') {
        if (!body.excerpt || !body.content || !body.image) {
             return NextResponse.json({ error: 'Published posts require Content, Excerpt, and a Featured Image.' }, { status: 400 });
        }
    }

    // Use Real User ID for Reference
    // Super Admin can assign author, otherwise defaults to current user
    if (input.author !== undefined &&
        (typeof input.author !== 'string' || !mongoose.isValidObjectId(input.author))) {
      return NextResponse.json({ error: 'Invalid author.' }, { status: 400 });
    }
    const authorId = user.role === 'super_admin' && typeof input.author === 'string'
        ? input.author
        : user.id;
    
    // Calculate read time
    let plainText = "";
    if (body.contentJson) {
        const nodes: unknown[] = [body.contentJson];
        const textParts: string[] = [];
        while (nodes.length > 0) {
            const node = nodes.pop();
            if (!node || typeof node !== 'object' || Array.isArray(node)) continue;
            const record = node as Record<string, unknown>;
            if (record.type === 'text' && typeof record.text === 'string') {
                textParts.push(record.text);
            }
            if (Array.isArray(record.content)) {
                for (const child of record.content) nodes.push(child);
            }
        }
        plainText = textParts.join(' ');
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
        content: sanitizeArticleHtml(body.content || ""),
        author: authorId,
        readTime: readTimeVal
    });

    // BUST CACHE
    revalidatePath("/admin/posts");
    revalidatePath("/");

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: unknown) {
    // Handle duplicate slug error
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ error: 'Slug must be unique' }, { status: 409 });
    }
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
  }
}
