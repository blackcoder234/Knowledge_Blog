// ... existing imports
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

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
    await dbConnect();
    const body = await req.json();
    const { name, genre, language } = body;

    if (!name || !genre) {
       return NextResponse.json({ error: "Name and Genre are required" }, { status: 400 });
    }

    // Generate Slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await Category.findOne({ slug });
    if (existing) {
        return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const newCategory = await Category.create({
      name,
      slug,
      genre,
      language: language || 'English'
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
