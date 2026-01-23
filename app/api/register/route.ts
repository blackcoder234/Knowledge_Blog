import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import Setting from '@/models/Setting';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await dbConnect();

    // Check if registration is enabled
    const regSetting = await Setting.findOne({ key: 'registration_enabled' });
    if (regSetting && regSetting.value === false) {
        return NextResponse.json({ error: 'Public registration is currently disabled' }, { status: 403 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user'
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
