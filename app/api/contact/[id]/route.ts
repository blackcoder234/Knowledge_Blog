import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    
    await Contact.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Message deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
  
      const { id } = await params;
      const { read } = await req.json();

      await dbConnect();
      
      const updated = await Contact.findByIdAndUpdate(id, { read }, { new: true });
  
      return NextResponse.json(updated);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
