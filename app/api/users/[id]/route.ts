import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

// GET Public User Profile
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await dbConnect();

    // Fetch user but exclude sensitive fields like password
    const user = await User.findById(id).select(
      'name image bio articleSignature title qualification occupation location bannerImage socialLinks createdAt'
    );
    
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch Authored Posts
    const posts = await Post.find({
        author: user._id, 
        status: 'published' 
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('title slug excerpt image createdAt category readTime views tags')
    .populate({ path: "category", model: Category, select: "name" })
    .lean();

    return NextResponse.json({
        ...user.toObject(),
        posts: posts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            image: p.image,
            _id: p._id.toString(),
            createdAt: p.createdAt.toISOString(),
            readTime: p.readTime,
            views: p.views,
            tags: p.tags,
            category: p.category?.name || "Uncategorized" // Flatten object to string
        }))
    });
  } catch (error) {
    console.error('Failed to fetch public user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// DELETE User
// DELETE User
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;

    if (!session || !['super_admin', 'admin'].includes(currentUserRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (id === currentUserId) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await dbConnect();
    const targetUser = await User.findById(id);

    if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role-based deletion logic
    if (currentUserRole === 'admin') {
        // Admins cannot delete other Admins or Super Admins
        if (['admin', 'super_admin'].includes(targetUser.role)) {
            return NextResponse.json({ error: 'Unauthorized: Cannot delete a superior or peer' }, { status: 403 });
        }
    }

    if (
      targetUser.role === 'super_admin' &&
      await User.countDocuments({ role: 'super_admin' }) <= 1
    ) {
      return NextResponse.json(
        { error: 'Cannot delete the sole Super Admin account. Designate another Super Admin first.' },
        { status: 400 },
      );
    }
    
    // Super Admins can delete anyone (except themselves, handled above)

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}

// UPDATE User Role
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getServerSession(authOptions);
      const currentUserRole = (session?.user as any)?.role;

      if (!session || !['super_admin', 'admin'].includes(currentUserRole)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await params;
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const bodyResult = await readLimitedRequestText(req, 4096);
      if ('error' in bodyResult) {
        const tooLarge = bodyResult.error === 'too_large';
        return NextResponse.json(
          { error: tooLarge ? 'Request body too large.' : 'Request body is required.' },
          { status: tooLarge ? 413 : 400 },
        );
      }
      let body: unknown;
      try {
        body = JSON.parse(bodyResult.text);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Invalid role update.' }, { status: 400 });
      }
      const newRole = (body as Record<string, unknown>).role;
      
      const validRoles = ['user', 'admin', 'editor', 'super_admin'];
      if (typeof newRole !== 'string' || !validRoles.includes(newRole)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      await dbConnect();
      
      // Fetch target user to check their current rank
      const targetUser = await User.findById(id);
      if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // LOGIC MATRIX:
      // Super Admin: Can do anything.
      // Admin: 
      //    - Can set role to 'user' or 'editor'.
      //    - CANNOT set role to 'admin' or 'super_admin'.
      //    - CANNOT modify a target who is currently 'admin' or 'super_admin'.

      if (currentUserRole === 'admin') {
          // 1. Prevent promoting to admin/super_admin
          if (['admin', 'super_admin'].includes(newRole)) {
              return NextResponse.json({ error: 'Unauthorized: Admins cannot create other Admins' }, { status: 403 });
          }
          // 2. Prevent modifying existing admins
          if (['admin', 'super_admin'].includes(targetUser.role)) {
               return NextResponse.json({ error: 'Unauthorized: Cannot modify a superior or peer' }, { status: 403 });
          }
      }

      if (
        targetUser.role === 'super_admin' &&
        newRole !== 'super_admin' &&
        await User.countDocuments({ role: 'super_admin' }) <= 1
      ) {
        return NextResponse.json(
          { error: 'Cannot remove the sole Super Admin role. Designate another Super Admin first.' },
          { status: 400 },
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role: newRole },
        { new: true, runValidators: true },
      ).select('-password');
      if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
      return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Failed to update user role:', error);
      return NextResponse.json({ error: 'Failed to update user role.' }, { status: 500 });
    }
  }
