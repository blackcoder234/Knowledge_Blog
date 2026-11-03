import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import PostRevision from '@/models/PostRevision';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import mongoose from 'mongoose';

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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
        }
        await dbConnect();
        
        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Public access guard:
        // Public callers can only retrieve published posts.
        // Drafts, scheduled, and archived posts strictly require authenticated administrative authorization.
        if (post.status !== 'published') {
            const session = await getServerSession(authOptions);
            const user = session?.user as any;
            if (!session || !user) {
                return NextResponse.json(
                    { error: "Unauthorized: Access to unpublished posts requires administrative authentication." },
                    { status: 401 }
                );
            }

            const canView =
                user.role === 'super_admin' ||
                user.role === 'admin' ||
                user.role === 'editor' ||
                (post.author && post.author.toString() === user.id);

            if (!canView) {
                return NextResponse.json(
                    { error: "Forbidden: You do not have permission to view unpublished posts." },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Failed to fetch post:', error);
        return NextResponse.json({ error: 'Failed to fetch post.' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['editor', 'admin', 'super_admin'].includes(user?.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
        }
        await dbConnect();
        
        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // PERMISSION CHECK
        // Super Admin: Can delete anything.
        // Others: Can ONLY delete their own posts.
        
        const canDelete = 
            user.role === 'super_admin' || 
            (post.author?.toString?.() === user.id);

        if (!canDelete) {
            return NextResponse.json({ error: "Unauthorized: You can only delete your own posts." }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);
        
        // BUST CACHE
        revalidatePath("/admin/posts");
        revalidatePath(`/blog/${post.slug}`);
        revalidatePath("/");

        return NextResponse.json({ message: "Post deleted" });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || !['editor', 'admin', 'super_admin'].includes(user?.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
        }
        const bodyResult = await readLimitedRequestText(request, MAX_POST_BODY_BYTES);
        if ('error' in bodyResult) {
            const tooLarge = bodyResult.error === 'too_large';
            return NextResponse.json(
                { error: tooLarge ? 'Post content exceeds the 2 MB request limit.' : 'Request body is required.' },
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
        const unknownFields = Object.keys(input).filter(
            (key) => key !== 'author' && !WRITABLE_POST_FIELDS.includes(key),
        );
        if (unknownFields.length > 0) {
            return NextResponse.json({ error: 'Request contains unsupported post fields.' }, { status: 400 });
        }
        if (input.author !== undefined &&
            (typeof input.author !== 'string' || !mongoose.isValidObjectId(input.author))) {
            return NextResponse.json({ error: 'Invalid author.' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        for (const key of WRITABLE_POST_FIELDS) {
            if (input[key] !== undefined) updateData[key] = input[key];
        }
        if (input.author !== undefined) updateData.author = input.author;

        const stringLimits: Record<string, number> = {
            title: 200,
            slug: 180,
            excerpt: 5000,
            content: MAX_POST_BODY_BYTES,
            language: 40,
            image: 2048,
            seoTitle: 200,
            seoDescription: 500,
            canonicalUrl: 2048,
            ogImage: 2048,
        };
        for (const [field, maxLength] of Object.entries(stringLimits)) {
            const value = updateData[field];
            if (value !== undefined &&
                (typeof value !== 'string' || value.length > maxLength)) {
                return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
            }
        }
        if (updateData.title !== undefined && !(updateData.title as string).trim()) {
            return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
        }
        if (updateData.slug !== undefined &&
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(updateData.slug as string)) {
            return NextResponse.json({ error: 'Slug must contain lowercase letters, numbers, and single hyphens.' }, { status: 400 });
        }
        if (updateData.content !== undefined &&
            Buffer.byteLength(updateData.content as string, 'utf8') > MAX_POST_BODY_BYTES) {
            return NextResponse.json({ error: 'Post content exceeds the 2 MB request limit.' }, { status: 413 });
        }
        if (updateData.contentJson !== undefined &&
            (!updateData.contentJson || typeof updateData.contentJson !== 'object' || Array.isArray(updateData.contentJson))) {
            return NextResponse.json({ error: 'Post JSON content must be an object.' }, { status: 400 });
        }
        if (updateData.category !== undefined &&
            (typeof updateData.category !== 'string' || !mongoose.isValidObjectId(updateData.category))) {
            return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
        }
        if (updateData.tags !== undefined &&
            (!Array.isArray(updateData.tags) ||
                updateData.tags.length > 30 ||
                updateData.tags.some((tag) => typeof tag !== 'string' || tag.length > 50))) {
            return NextResponse.json({ error: 'Tags must be an array of at most 30 strings.' }, { status: 400 });
        }
        for (const field of ['featured', 'noindex']) {
            if (updateData[field] !== undefined && typeof updateData[field] !== 'boolean') {
                return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
            }
        }
        if (updateData.status === 'scheduled') {
            return NextResponse.json(
                { error: 'Scheduled publishing is disabled. Save as a draft or publish immediately.' },
                { status: 400 },
            );
        }
        if (updateData.status !== undefined &&
            !['draft', 'published', 'archived'].includes(updateData.status as string)) {
            return NextResponse.json({ error: 'Invalid post status.' }, { status: 400 });
        }

        await dbConnect();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (post.status === 'scheduled' && updateData.status === undefined) {
            return NextResponse.json(
                { error: 'This post was scheduled before scheduling was disabled. Choose draft, published, or archived before saving.' },
                { status: 400 },
            );
        }

        // PERMISSION CHECK
        const canEdit = 
            user.role === 'super_admin' || 
            (post.author?.toString?.() === user.id);

        if (!canEdit) {
            return NextResponse.json({ error: "Unauthorized: You can only edit your own posts." }, { status: 403 });
        }
        if (updateData.author !== undefined && user.role !== 'super_admin') {
            if (updateData.author !== post.author?.toString?.()) {
                return NextResponse.json({ error: 'Only a super admin can reassign a post author.' }, { status: 403 });
            }
            delete updateData.author;
        }

        // VALIDATION UPDATES
        // If they are trying to publish, ensure requirements are met
        if (updateData.status === 'published') {
            const merged = { ...post.toObject(), ...updateData };
            if (!merged.excerpt || !merged.content || !merged.image) {
                return NextResponse.json({ error: 'Cannot publish without Content, Excerpt, and Featured Image.' }, { status: 400 });
            }
        }

        if (typeof updateData.content === "string") {
            updateData.content = sanitizeArticleHtml(updateData.content);
        }

        // Recalculate read time if content is being updated
        if (updateData.content !== undefined || updateData.contentJson !== undefined) {
            let plainText = "";
            if (updateData.contentJson && typeof updateData.contentJson === 'object') {
                const pendingNodes: unknown[] = [updateData.contentJson];
                while (pendingNodes.length > 0) {
                    const node = pendingNodes.pop();
                    if (!node || typeof node !== 'object' || Array.isArray(node)) continue;
                    const record = node as Record<string, unknown>;
                    if (record.type === 'text' && typeof record.text === 'string') {
                        plainText += `${record.text} `;
                    }
                    if (Array.isArray(record.content)) pendingNodes.push(...record.content);
                }
            } else if (typeof updateData.content === 'string') {
                plainText = updateData.content.replace(/<[^>]*>/g, ' ');
            }

            const words = plainText.trim().split(/\s+/).filter(Boolean).length;
            updateData.readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
        }

        try {
            await PostRevision.create({
                postId: post._id,
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                contentJson: post.contentJson,
                author: user.id || post.author,
                tags: post.tags,
                image: post.image
            });
        } catch (revError) {
             console.error("Failed to create revision", revError);
        }

        const finalPost = await Post.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!finalPost) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        revalidatePath("/admin/posts");
        if (post.slug !== finalPost.slug) {
            revalidatePath(`/blog/${post.slug}`);
        }
        revalidatePath(`/blog/${finalPost.slug}`);
        revalidatePath("/");

        return NextResponse.json(finalPost);
    } catch (error) {
        console.error('Failed to update post:', error);
        return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 });
    }
}

export const PUT = PATCH;
