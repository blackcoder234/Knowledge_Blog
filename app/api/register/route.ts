import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import Setting from '@/models/Setting';
import { checkDistributedRateLimit } from '@/lib/ai-studio/rateLimiter';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';
import { isValidPassword } from '@/lib/passwordValidation';
import { getTrustedClientIp } from '@/lib/trustedClientIp';
import { findUserEmailMatches, normalizeUserEmail } from '@/lib/userEmail';

export async function POST(request: Request) {
  try {
    const bodyResult = await readLimitedRequestText(request, 4096);
    if ('error' in bodyResult) {
      if (bodyResult.error === 'too_large') {
        return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      }
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyResult.text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid registration data' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeUserEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (
      !name ||
      name.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !isValidPassword(password)
    ) {
        return NextResponse.json(
          { error: 'Enter a valid name and email, and a password of 8-72 bytes.' },
          { status: 400 }
        );
    }

    const clientIp = getTrustedClientIp(request.headers);
    if (!clientIp) {
      return NextResponse.json(
        { error: 'Registration is temporarily unavailable. Unable to verify client connection.' },
        { status: 400 },
      );
    }

    const ipKey = `ip:${createHash('sha256').update(clientIp).digest('hex')}`;
    const emailKey = `email:${createHash('sha256').update(email).digest('hex')}`;

    const [ipLimit, emailLimit] = await Promise.all([
      checkDistributedRateLimit(ipKey, 'registration'),
      checkDistributedRateLimit(emailKey, 'registration'),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const isUnavailable = ipLimit.isServiceUnavailable || emailLimit.isServiceUnavailable;
      const retryAfter = Math.max(ipLimit.retryAfterSeconds || 0, emailLimit.retryAfterSeconds || 0);
      return NextResponse.json(
        { error: isUnavailable ? 'Registration is temporarily unavailable.' : 'Too many registration attempts. Try again later.' },
        {
          status: isUnavailable ? 503 : 429,
          headers: isUnavailable
            ? undefined
            : { 'Retry-After': String(retryAfter) },
        },
      );
    }

    await dbConnect();

    // Check if registration is enabled
    const regSetting = await Setting.findOne({ key: 'registration_enabled' });
    if (regSetting && regSetting.value === false) {
        return NextResponse.json({ error: 'Public registration is currently disabled' }, { status: 403 });
    }

    // Check if user exists
    const existingUsers = await findUserEmailMatches(email);
    if (existingUsers.length > 0) {
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

  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Unable to complete registration.' }, { status: 500 });
  }
}
