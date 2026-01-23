import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function GET() {
  await dbConnect();
  try {
    // Return all settings as an object { key: { value, updatedBy, updatedAt } }
    const settings = await Setting.find({});
    const formatted = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = {
        value: curr.value,
        updatedBy: curr.updatedBy,
        updatedAt: curr.updatedAt,
      };
      return acc;
    }, {});
    
    // Default maintenance to false if not present
    if (formatted.maintenance_mode === undefined) {
        formatted.maintenance_mode = { value: false };
    }

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await dbConnect();
    
    const updatedSetting = await Setting.findOneAndUpdate(
      { key },
      { value, updatedBy: session.user?.name || session.user?.email },
      { upsert: true, new: true }
    );

    // BUST CACHE
    revalidatePath("/");
    revalidatePath("/admin/settings");

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
