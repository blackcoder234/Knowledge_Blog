import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import PostRevision from '@/models/PostRevision';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        
        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        const { id } = await params;
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
            (post.author.toString() === user.id);

        if (!canDelete) {
            return NextResponse.json({ error: "Unauthorized: You can only delete your own posts." }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);
        
        // BUST CACHE
        revalidatePath("/admin/posts");
        revalidatePath(`/blog/${post.slug}`);
        revalidatePath("/");

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
            (post.author.toString() === user.id);

        if (!canEdit) {
            return NextResponse.json({ error: "Unauthorized: You can only edit your own posts." }, { status: 403 });
        }

        // VALIDATION UPDATES
        // If they are trying to publish, ensure requirements are met
        if (body.status === 'published') {
            // Merge existing data with update data to check completeness
            const merged = { ...post.toObject(), ...body };
            if (!merged.excerpt || !merged.content || !merged.image) {
                return NextResponse.json({ error: 'Cannot publish without Content, Excerpt, and Featured Image.' }, { status: 400 });
            }
        }

        if (body.status === 'scheduled') {
             // If scheduling, ensure they provided a date OR it already has one
             if (!body.scheduledPublishDate && !post.scheduledPublishDate) {
                 return NextResponse.json({ error: 'Cannot schedule without a date.' }, { status: 400 });
             }
             const merged = { ...post.toObject(), ...body };
             if (!merged.excerpt || !merged.content || !merged.image) {
                 return NextResponse.json({ error: 'Cannot schedule without Content, Excerpt, and Featured Image.' }, { status: 400 });
             }
        }

        // PERMISSION: Only Super Admin can change the Author
        if (user.role !== 'super_admin') {
            delete body.author;
        }

        // Recalculate read time if content is being updated
        if (body.content || body.contentJson) {
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
                plainText = body.content.replace(/<[^>]*>/g, ' ');
            }
            
            const words = plainText.trim().split(/\s+/).length;
            body.readTime = `${Math.ceil(words / 200)} min read`;
        }

        // SAVE REVISION BEFORE UPDATE
        // We only save a revision if we are actually changing content/title/status
        // and if the post is already published or draft (not just a minor view count update, though that's usually separate)
        // Here we assume all PATCHes to this endpoint are content updates.
        
        try {
            await PostRevision.create({
                postId: post._id,
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                contentJson: post.contentJson,
                author: user.id || post.author, // The person performing the overwrite (current user)
                tags: post.tags,
                image: post.image
            });
        } catch (revError) {
             console.error("Failed to create revision", revError);
             // We don't block the main update if revision fails, but we log it.
        }

        const finalPost = await Post.findByIdAndUpdate(id, body, { new: true });

        // BUST CACHE
        revalidatePath("/admin/posts");
        revalidatePath(`/blog/${finalPost.slug}`);
        revalidatePath("/");

        return NextResponse.json(finalPost);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
