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

// GET certificates by ?studentId or ?teacherId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');

    let query = adminDb.collection('certificates').orderBy('issuedAt', 'desc');

    if (studentId) {
      query = query.where('studentId', '==', studentId);
    } else if (teacherId) {
      query = query.where('teacherId', '==', teacherId);
    } else {
      return NextResponse.json(
        { success: false, message: 'studentId or teacherId query parameter is required' },
        { status: 400 }
      );
    }

    const snapshot = await query.get();
    const certificates = snapshot.docs.map(toObj);

    return NextResponse.json({
      success: true,
      certificates,
      total: certificates.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST issue certificate
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const { studentId, courseId, teacherId, title, certificateUrl } = await req.json();

    if (!studentId || !courseId) {
      return NextResponse.json(
        { success: false, message: 'studentId and courseId are required' },
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

    // Verify course exists
    const courseDoc = await adminDb.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if certificate already exists for this student + course
    const existingSnap = await adminDb
      .collection('certificates')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return NextResponse.json(
        { success: false, message: 'Certificate already exists for this student and course' },
        { status: 409 }
      );
    }

    const docRef = await adminDb.collection('certificates').add({
      studentId,
      courseId,
      teacherId: teacherId || null,
      title: title || (courseDoc.data().title as string) || 'Certificate of Completion',
      certificateUrl: certificateUrl || null,
      issuedAt: FieldValue.serverTimestamp(),
    });

    const certificate = toObj(await docRef.get());

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
