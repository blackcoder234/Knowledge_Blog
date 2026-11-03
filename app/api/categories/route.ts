// ... existing imports
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readLimitedRequestText } from '@/lib/readLimitedRequestText';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language');

    await dbConnect();

    const query: any = {};
    if (language && language !== 'All') {
      query.language = language;
    }

    const categories = await Category.find(query).sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || !['editor', 'admin', 'super_admin'].includes(role || '')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bodyResult = await readLimitedRequestText(req, 8192);
    if ('error' in bodyResult) {
      const tooLarge = bodyResult.error === 'too_large';
      return NextResponse.json(
        { error: tooLarge ? 'Category request exceeds the 8 KB limit.' : 'Request body is required.' },
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
      return NextResponse.json({ error: 'Invalid category data.' }, { status: 400 });
    }
    const { name, genre, language } = body as {
      name?: unknown;
      genre?: unknown;
      language?: unknown;
    };

    if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
        typeof genre !== 'string' || !genre.trim() || genre.length > 100 ||
        (language !== undefined && (typeof language !== 'string' || language.length > 50))) {
       return NextResponse.json({ error: "Name and Genre are required" }, { status: 400 });
    }
    await dbConnect();

    // Generate Slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) {
      return NextResponse.json({ error: "Category name must contain letters or numbers" }, { status: 400 });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
        return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      slug,
      genre: genre.trim(),
      language: typeof language === 'string' && language ? language : 'English'
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
