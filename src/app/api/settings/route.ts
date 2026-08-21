import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'config';

export async function GET(req: Request) {
  try {
    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, settings: null });
    }
    const data = doc.data() || null;
    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const payload = await req.json();
    await adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(payload, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
