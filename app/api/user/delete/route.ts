import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('role');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (
      user.role === 'super_admin' &&
      await User.countDocuments({ role: 'super_admin' }) <= 1
    ) {
      return NextResponse.json(
        { error: 'Cannot delete the sole Super Admin account. Designate another Super Admin first.' },
        { status: 400 },
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
