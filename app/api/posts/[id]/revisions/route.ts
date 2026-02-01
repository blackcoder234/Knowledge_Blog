import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PostRevision from '@/models/PostRevision';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
         const session = await getServerSession(authOptions);
         const user = session?.user as any;
         
         // Only Editors/Admins should see revisions
         const allowedRoles = ['editor', 'admin', 'super_admin'];
         if (!session || !allowedRoles.includes(user?.role)) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
         }

        const { id } = await params;
        await dbConnect();
        
        // Fetch revisions for this post
        // Sort by newest first
        const revisions = await PostRevision.find({ postId: id })
            .sort({ createdAt: -1 })
            .populate("author", "name email") // See who made the change
            .limit(20); // Limit to last 20 revisions to save bandwidth

        return NextResponse.json(revisions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
