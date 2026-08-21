import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

function toObj(doc: { id: string; data(): Record<string, unknown> }) {
  const d = doc.data();
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

// GET all badges or badges earned by ?studentId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      const snapshot = await adminDb
        .collection('badges')
        .where('studentId', '==', studentId)
        .orderBy('awardedAt', 'desc')
        .get();

      const earnedBadges = snapshot.docs.map(toObj);

      return NextResponse.json({
        success: true,
        earnedBadges,
        totalEarned: earnedBadges.length,
      });
    }

    // Get all available badges (no studentId filter)
    const snapshot = await adminDb
      .collection('badges')
      .orderBy('createdAt', 'desc')
      .get();

    const badges = snapshot.docs.map(toObj);

    return NextResponse.json({ success: true, badges });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST award badge to a student
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const { studentId, name, description, icon } = await req.json();

    if (!studentId || !name) {
      return NextResponse.json(
        { success: false, message: 'studentId and name are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    const docRef = await adminDb.collection('badges').add({
      studentId,
      name,
      description: description || null,
      icon: icon || null,
      awardedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    const badge = toObj(await docRef.get());

    return NextResponse.json({ success: true, badge }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
