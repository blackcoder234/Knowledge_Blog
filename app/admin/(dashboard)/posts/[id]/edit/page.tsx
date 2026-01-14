import PostEditor from '../../../../components/PostEditor';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getPost(id: string) {
    await dbConnect();
    const post = await Post.findById(id).lean();
    if (!post) return null;
    return JSON.parse(JSON.stringify(post)); // Serialize for client component
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        notFound();
    }

    return <PostEditor initialData={post} isEdit={true} />;
}
