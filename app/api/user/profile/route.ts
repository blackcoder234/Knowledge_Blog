import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, bio, articleSignature, image, title, qualification, occupation, location, bannerImage, socialLinks } = await req.json();
    const userId = (session.user as any).id;
    
    // If password provided, handle hashing (TODO: Implement bcrypt if specifically requested, but safe to ignore for now if not sent)

    await dbConnect();
    
    // Only update fields that are provided
    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (articleSignature !== undefined) updateData.articleSignature = articleSignature;
    if (image) updateData.image = image;
    if (title !== undefined) updateData.title = title;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (location !== undefined) updateData.location = location;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    return NextResponse.json({ message: 'Profile updated', user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
