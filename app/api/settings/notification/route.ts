import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();
  try {
    const settings = await Setting.find({ key: { $in: ['general_notification', 'general_notification_active', 'general_notification_type', 'general_notification_id'] } });
    
    const config = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    return NextResponse.json({
        active: config.general_notification_active || false,
        message: config.general_notification || '',
        type: config.general_notification_type || 'info',
        id: config.general_notification_id || '0'
    });
  } catch (error) {
    return NextResponse.json({ active: false, error: 'Failed' }, { status: 500 });
  }
}
