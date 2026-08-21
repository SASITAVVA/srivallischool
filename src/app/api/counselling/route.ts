import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';
import { FieldValue, DocumentSnapshot } from 'firebase-admin/firestore';

function toObj(doc: DocumentSnapshot) {
  const d = doc.data() ?? {};
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

// GET counselling records — optional teacherId filter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    let query = adminDb
      .collection('counselling')
      .orderBy('createdAt', 'desc');

    if (teacherId) {
      query = adminDb
        .collection('counselling')
        .where('teacherId', '==', teacherId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const records = snapshot.docs.map(toObj);

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Fetch counselling records error:', error);
    return handleApiError(error);
  }
}

// POST create counselling record
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);

    const { teacherId, studentId, date, type, notes, followUpDate, followUpRequired } = await req.json();

    if (!teacherId || !studentId || !date || !type) {
      return NextResponse.json(
        { success: false, message: 'teacherId, studentId, date, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['academic', 'behavioral', 'progress', 'general'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: 'type must be one of: academic, behavioral, progress, general' },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection('counselling').add({
      teacherId,
      studentId,
      date,
      type,
      notes: notes || '',
      followUpDate: followUpDate || null,
      followUpRequired: !!followUpRequired,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    const record = toObj(doc!);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
