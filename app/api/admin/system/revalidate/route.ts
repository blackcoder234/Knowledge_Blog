import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    revalidatePath('/', 'layout'); // Purge everything
    return NextResponse.json({ message: 'Global cache purged' });
  } catch (err) {
    console.error("Cache purge failed:", err);
    return NextResponse.json({ error: 'Failed to purge cache' }, { status: 500 });
  }
}
