import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { isValidPassword } from '@/lib/passwordValidation';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readLimitedRequestText(req, 4096);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Password request exceeds the size limit.' : 'Request body is required.' },
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
    const { currentPassword, newPassword } = body as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    if (
      typeof currentPassword !== 'string' ||
      !currentPassword ||
      Buffer.byteLength(currentPassword, 'utf8') > 72 ||
      !isValidPassword(newPassword)
    ) {
      return NextResponse.json(
        { error: 'Current password is required; new password must be 8-72 bytes.' },
        { status: 400 },
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify current password
    if (!user.password) {
        return NextResponse.json({ error: 'No password set (Social Login account)' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { runValidators: true },
    );

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update failed:', error);
    return NextResponse.json({ error: 'Unable to update password.' }, { status: 500 });
  }
}
