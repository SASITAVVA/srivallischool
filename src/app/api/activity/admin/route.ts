import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';

function toObj(doc: { id: string; data(): Record<string, unknown> }) {
  const d = doc.data();
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

export async function GET(req: Request) {
  try {
    await requireRole(req, ['admin']);

    const snapshot = await adminDb
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const activities = snapshot.docs.map(toObj);

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
