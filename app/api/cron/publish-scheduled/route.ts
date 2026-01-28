import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { revalidatePath } from 'next/cache';

// This route is called by an external Cron Service (e.g. GitHub Actions, Cron-Job.org)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        // SECURITY CHECK
        // You must set CRON_SECRET in your .env.local variables
        const CRON_SECRET = process.env.CRON_SECRET || 'my_fallback_secret_key_123';
        
        if (key !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const now = new Date();

        // Find posts that are 'scheduled' AND their date has passed
        const postsToPublish = await Post.find({
            status: 'scheduled',
            scheduledPublishDate: { $lte: now }
        });

        if (postsToPublish.length === 0) {
             return NextResponse.json({ message: 'No posts to publish', count: 0 });
        }

        // Update them all to 'published'
        // We do this individually to ensure hooks or revalidation works if needed, usually redundant but safer
        const updatePromises = postsToPublish.map(post => 
            Post.findByIdAndUpdate(post._id, { status: 'published' })
        );

        await Promise.all(updatePromises);

        // Revalidate Cache so they appear on the homepage immediately
        revalidatePath('/');
        revalidatePath('/blog');
        revalidatePath('/feed.xml'); // Re-generate RSS if applicable

        return NextResponse.json({ 
            success: true, 
            count: postsToPublish.length,
            ids: postsToPublish.map(p => p._id)
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
