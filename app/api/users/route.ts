import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { isValidPassword } from '@/lib/passwordValidation';
import { findUserEmailMatches, normalizeUserEmail } from '@/lib/userEmail';

const VALID_ROLES = ['user', 'admin', 'editor', 'super_admin'];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if admin OR super_admin
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination.' }, { status: 400 });
    }
    const skip = (page - 1) * limit;

    await dbConnect();
    
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find({}, '-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return NextResponse.json({
        users,
        totalPages,
        currentPage: page
    });
  } catch (error) {
    console.error('Failed to list users:', error);
    return NextResponse.json({ error: 'Failed to list users.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(currentUserRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const bodyResult = await readLimitedRequestText(request, 8192);
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
      return NextResponse.json({ error: 'Invalid user data.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = normalizeUserEmail(input.email);
    const password = input.password;
    const role = input.role === undefined ? 'user' : input.role;
    const title = input.title === undefined ? '' : input.title;
    const bio = input.bio === undefined ? '' : input.bio;
    if (
      !name || name.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !isValidPassword(password) ||
      typeof role !== 'string' || !VALID_ROLES.includes(role) ||
      typeof title !== 'string' || title.length > 120 ||
      typeof bio !== 'string' || bio.length > 2000
    ) {
      return NextResponse.json({ error: 'Invalid user data.' }, { status: 400 });
    }

    // Role restrictions
    if (currentUserRole === 'admin' && ['admin', 'super_admin'].includes(role)) {
         return NextResponse.json({ error: 'Admins cannot create other Admins' }, { status: 403 });
    }

    await dbConnect();

    const existingUsers = await findUserEmailMatches(email);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        title: title || '',
        bio: bio || '',
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    // Valid response excluding password
    const { password: _, ...userWithoutPass } = newUser.toObject();

    return NextResponse.json(userWithoutPass, { status: 201 });

  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
