import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError, verifyToken } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const user = await verifyToken(req);
    const body = await req.json();
    
    if (user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Only students can submit assignments' }, { status: 403 });
    }

    if (!body.assignmentId || (!body.content && !body.fileUrl)) {
      return NextResponse.json({ success: false, message: 'Assignment ID and either content or file URL are required' }, { status: 400 });
    }

    const studentDoc = await adminDb.collection('students').doc(user.uid).get();
    const parentId = studentDoc.exists ? studentDoc.data()?.parentId : null;

    const newSubmission = {
      assignmentId: body.assignmentId,
      studentId: user.uid,
      parentId: parentId || null,
      content: body.content || '',
      fileUrl: body.fileUrl || null,
      status: 'submitted',
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('assignment_submissions').add(newSubmission);
    
    return NextResponse.json({ success: true, submissionId: docRef.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
