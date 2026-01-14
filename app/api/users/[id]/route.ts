import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// DELETE User
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized: Only Super Admin can delete users' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      const { role: newRole } = await req.json();
      
      const validRoles = ['user', 'admin', 'editor', 'super_admin'];
      if (!validRoles.includes(newRole)) {
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

      const updatedUser = await User.findByIdAndUpdate(id, { role: newRole }, { new: true });
  
      return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
