import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }
    await dbConnect();
    
    await Contact.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Failed to delete contact message:', error);
    return NextResponse.json({ error: 'Failed to delete message.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await params;
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
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
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          typeof (body as Record<string, unknown>).read !== 'boolean') {
        return NextResponse.json({ error: 'Read status must be a boolean.' }, { status: 400 });
      }
      const { read } = body as { read: boolean };

      await dbConnect();
      
      const updated = await Contact.findByIdAndUpdate(id, { read }, { new: true, runValidators: true });
      if (!updated) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Failed to update contact message:', error);
      return NextResponse.json({ error: 'Failed to update message.' }, { status: 500 });
    }
}
