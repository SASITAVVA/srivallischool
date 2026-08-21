import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError , verifyToken, verifyStudentAccess } from '@/lib/verifyToken';
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

// GET learning materials by courseId
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (user.role === 'student') {
      await verifyStudentAccess(user.uid, courseId || undefined);
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'courseId query parameter is required' },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection('materials')
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc')
      .get();

    const materials = snapshot.docs.map(toObj);

    return NextResponse.json({ success: true, materials });
  } catch (error) {
    console.error('Fetch materials error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST create learning material (teacher)
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);

    const { courseId, teacherId, title, description, type, fileUrl } = await req.json();

    if (!courseId || !title || !type) {
      return NextResponse.json(
        { success: false, message: 'courseId, title, and type are required' },
        { status: 400 }
      );
    }

    // Verify course exists
    const courseDoc = await adminDb.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    const docRef = await adminDb.collection('materials').add({
      courseId,
      teacherId,
      title,
      description,
      type,
      fileUrl,
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    const material = toObj(doc!);

    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
