import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = await import('firebase-admin/app');
    return NextResponse.json({ 
      status: 'firebase-admin/app loaded OK',
      exports: Object.keys(admin).join(', ')
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack 
    }, { status: 500 });
  }
}
