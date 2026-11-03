import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { safeExternalUrl } from '@/lib/safeExternalUrl';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readLimitedRequestText(req, 16384);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Profile request is too large.' : 'Request body is required.' },
        { status: tooLarge ? 413 : 400 },
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const { name, bio, articleSignature, image, title, qualification, occupation, location, bannerImage, socialLinks } = input;

    const textFields: Array<[string, unknown, number]> = [
      ['name', name, 80],
      ['bio', bio, 2000],
      ['articleSignature', articleSignature, 500],
      ['image', image, 2048],
      ['title', title, 120],
      ['qualification', qualification, 160],
      ['occupation', occupation, 160],
      ['location', location, 120],
      ['bannerImage', bannerImage, 2048],
    ];
    for (const [field, value, maxLength] of textFields) {
      if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
        return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
      }
    }
    if (typeof name === 'string' && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    }
    if (socialLinks !== undefined) {
      if (!socialLinks || typeof socialLinks !== 'object' || Array.isArray(socialLinks)) {
        return NextResponse.json({ error: 'Social links must be an object.' }, { status: 400 });
      }
      const links = socialLinks as Record<string, unknown>;
      const allowedLinks = ['twitter', 'linkedin', 'github', 'website', 'facebook', 'instagram'];
      if (Object.keys(links).some((key) => !allowedLinks.includes(key))) {
        return NextResponse.json({ error: 'Unsupported social link field.' }, { status: 400 });
      }
      for (const value of Object.values(links)) {
        if (value !== '' && value !== undefined && !safeExternalUrl(value)) {
          return NextResponse.json({ error: 'Social links must use a valid HTTP or HTTPS URL.' }, { status: 400 });
        }
      }
    }
    const userId = (session.user as any).id;
    
    // If password provided, handle hashing (TODO: Implement bcrypt if specifically requested, but safe to ignore for now if not sent)

    await dbConnect();
    
    // Only update fields that are provided
    const updateData: any = {};
    if (typeof name === 'string') updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (articleSignature !== undefined) updateData.articleSignature = articleSignature;
    if (image) updateData.image = image;
    if (title !== undefined) updateData.title = title;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (location !== undefined) updateData.location = location;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!updatedUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
