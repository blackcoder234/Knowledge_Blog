import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'bookmarks' or 'liked'

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const userId = (session.user as any).id;
        const user = await User.findById(userId);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let posts = [];

        if (type === 'bookmarks') {
            await user.populate({
                path: 'bookmarks',
                select: 'title slug excerpt image createdAt category'
            });
            return NextResponse.json(user.bookmarks);
        } else if (type === 'liked') {
            await user.populate({
                path: 'likedPosts',
                select: 'title slug excerpt image createdAt category'
            });
            return NextResponse.json(user.likedPosts);
        } else if (type === 'ids') {
             return NextResponse.json({
                liked: user.likedPosts,
                bookmarked: user.bookmarks
            });
        }

        return NextResponse.json([]);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }
}
