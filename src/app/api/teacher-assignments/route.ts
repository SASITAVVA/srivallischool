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

// GET all teacher-student assignments
export async function GET(req: Request) {
  try {
    const query = adminDb
      .collection('teacherAssignments')
      .orderBy('assignedDate', 'desc');

    const snapshot = await query.get();
    const assignments = snapshot.docs.map(toObj);

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Fetch teacher assignments error:', error);
    return handleApiError(error);
  }
}

// POST create teacher-student assignment
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin']);

    const { teacherId, studentId, courseIds, assignedDate, notes } = await req.json();

    if (!teacherId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'teacherId and at least one courseId are required' },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection('teacherAssignments').add({
      teacherId,
      studentId: studentId || null,
      courseIds: courseIds,
      assignedDate: assignedDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    const assignment = toObj(doc!);

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE remove teacher-student assignment by id
export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id query parameter is required' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('teacherAssignments').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true, message: 'Assignment removed successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
