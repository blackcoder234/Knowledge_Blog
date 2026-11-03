import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

export const dynamic = 'force-dynamic';
const MAX_SETTINGS_BODY_BYTES = 16 * 1024;
const EDITABLE_SETTING_KEYS = new Set([
  'maintenance_mode',
  'announcement_active',
  'announcement_message',
  'comments_enabled',
  'auto_close_days',
  'registration_enabled',
  'public_indexing',
  'ga_measurement_id',
  'site_title',
  'site_tagline',
  'social_twitter',
  'social_github',
  'social_linkedin',
  'social_facebook',
  'social_instagram',
  'admin_email',
  'newsletter_subject',
  'general_notification_active',
  'general_notification_id',
  'general_notification',
  'general_notification_type',
  'home_quote_text',
  'home_quote_author',
  'home_quote_link',
]);
const BOOLEAN_SETTING_KEYS = new Set([
  'maintenance_mode',
  'announcement_active',
  'comments_enabled',
  'registration_enabled',
  'public_indexing',
  'general_notification_active',
]);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    await dbConnect();

    if (!session || !['admin', 'super_admin'].includes(role || '')) {
      const publicSettings = await Setting.find({
        key: { $in: ['site_title', 'registration_enabled'] },
      }).select('key value').lean();
      const byKey = new Map(publicSettings.map((setting) => [setting.key, setting.value]));
      return NextResponse.json({
        site_title: { value: byKey.get('site_title') || 'KnowledgeLog' },
        registration_enabled: byKey.get('registration_enabled') !== false,
      });
    }

    // Return all settings as an object { key: { value, updatedBy, updatedAt } }
    const settings = await Setting.find({}).lean();
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
    console.error('Failed to fetch settings:', error);
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

    const bodyResult = await readLimitedRequestText(req, MAX_SETTINGS_BODY_BYTES);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Settings request exceeds the 16 KB limit.' : 'Request body is required.' },
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
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const { key, value } = body as { key?: unknown; value?: unknown };
    if (typeof key !== 'string' || !EDITABLE_SETTING_KEYS.has(key) || value === undefined) {
      return NextResponse.json({ error: 'Invalid setting key or missing value.' }, { status: 400 });
    }
    if (BOOLEAN_SETTING_KEYS.has(key) && typeof value !== 'boolean') {
      return NextResponse.json({ error: 'This setting requires a boolean value.' }, { status: 400 });
    }
    if (!BOOLEAN_SETTING_KEYS.has(key) &&
        typeof value !== 'string' &&
        (typeof value !== 'number' || !Number.isFinite(value))) {
      return NextResponse.json({ error: 'Setting value must be a string, boolean, or finite number.' }, { status: 400 });
    }
    if (typeof value === 'string' && value.length > 5000) {
      return NextResponse.json({ error: 'Setting value exceeds the 5000 character limit.' }, { status: 400 });
    }
    if (key === 'auto_close_days') {
      const days = Number(value);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return NextResponse.json({ error: 'Auto-close days must be an integer between 1 and 3650.' }, { status: 400 });
      }
    }

    await dbConnect();
    
    const updatedSetting = await Setting.findOneAndUpdate(
      { key },
      { value, updatedBy: session.user?.name || session.user?.email },
      { upsert: true, new: true }
    );

    // BUST CACHE
    revalidatePath("/", "layout"); // Revalidate Root Layout
    revalidatePath("/admin", "layout"); // Revalidate Admin Layout


    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
