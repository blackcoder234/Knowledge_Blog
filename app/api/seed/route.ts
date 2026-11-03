import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'The destructive seed endpoint has been disabled.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'The destructive seed endpoint has been disabled.' },
    { status: 410 }
  );
}
