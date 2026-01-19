import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if admin OR super_admin
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(currentUserRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, title, bio } = body;

    if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Check availability
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Role restrictions
    if (currentUserRole === 'admin' && ['admin', 'super_admin'].includes(role)) {
         return NextResponse.json({ error: 'Admins cannot create other Admins' }, { status: 403 });
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

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
