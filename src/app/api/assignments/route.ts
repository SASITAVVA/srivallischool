import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError, verifyToken, verifyStudentAccess } from '@/lib/verifyToken';
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

export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let allowedCourses: string[] = [];
    if (user.role === 'student') {
      allowedCourses = await verifyStudentAccess(user.uid, courseId || undefined);
    }

    let query: any = adminDb.collection('assignments');

    if (user.role === 'student') {
      if (allowedCourses.length === 0) return NextResponse.json({ success: true, assignments: [] });
      query = query.where('courseId', 'in', allowedCourses.slice(0, 30));
    }

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }
    
    // Fallback simple fetch without requiring complex composite index
    const snapshot = await query.get();
    let assignments = snapshot.docs.map(toObj);
    
    // Sort in memory to avoid requiring a composite index on isActive + createdAt
    assignments.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const body = await req.json();
    
    if (!body.title || !body.type) {
      return NextResponse.json({ success: false, message: 'Title and type are required' }, { status: 400 });
    }

    const newAssignment = {
      ...body,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('assignments').add(newAssignment);
    const doc = await docRef.get();

    return NextResponse.json({ success: true, assignment: toObj(doc) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
export async function PUT(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Assignment ID is required' }, { status: 400 });
    }

    await adminDb.collection('assignments').doc(id).update(updateData);
    const doc = await adminDb.collection('assignments').doc(id).get();

    return NextResponse.json({ success: true, assignment: toObj(doc) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Assignment ID is required' }, { status: 400 });
    }

    await adminDb.collection('assignments').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

