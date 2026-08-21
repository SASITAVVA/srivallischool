import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { QueryDocumentSnapshot, FieldValue } from 'firebase-admin/firestore';
import { requireRole, handleApiError } from '@/lib/verifyToken';
function toObj(doc: QueryDocumentSnapshot) {
  const d = doc.data();
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = (v as { toDate?: () => Date })?.toDate
      ? (v as { toDate: () => Date }).toDate().toISOString()
      : v;
  }
  return result;
}

// GET all teachers with class/quiz/assignment/certificate counts
export async function GET() {
  try {
    const teachersSnap = await adminDb
      .collection('teachers')
      .orderBy('createdAt', 'desc')
      .get();

    const teachers = await Promise.all(
      teachersSnap.docs.map(async (doc) => {
        const teacher = toObj(doc);
        const { password: _, ...safeTeacher } = teacher;

        const [classesSnap, quizzesSnap, assignmentsSnap, certificatesSnap] =
          await Promise.all([
            adminDb
              .collection('classes')
              .where('teacherId', '==', doc.id)
              .count()
              .get(),
            adminDb
              .collection('quizzes')
              .where('teacherId', '==', doc.id)
              .count()
              .get(),
            adminDb
              .collection('assignments')
              .where('teacherId', '==', doc.id)
              .count()
              .get(),
            adminDb
              .collection('certificates')
              .where('teacherId', '==', doc.id)
              .count()
              .get(),
          ]);

        return {
          ...safeTeacher,
          _count: {
            classes: classesSnap.data().count,
            quizzes: quizzesSnap.data().count,
            assignments: assignmentsSnap.data().count,
            issuedCertificates: certificatesSnap.data().count,
          },
        };
      })
    );

    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    console.error('Fetch teachers error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { name, email, password, subject, mobile } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'teacher' });

    await adminDb.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role: 'teacher',
      createdAt: FieldValue.serverTimestamp()
    });

    await adminDb.collection('teachers').doc(userRecord.uid).set({
      name,
      email,
      subject: subject || null,
      mobile: mobile || null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: 'Teacher added successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Teacher ID is required' }, { status: 400 });
    }

    try {
      await adminAuth.deleteUser(id);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    await adminDb.collection('teachers').doc(id).delete();
    await adminDb.collection('users').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}


export async function PUT(req: Request) {
  try {
    const user = await verifyToken(req);
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Teacher ID is required' }, { status: 400 });
    }

    if (user.role === 'teacher' && user.uid !== id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('teachers').doc(id).update(updateData);
    await adminDb.collection('users').doc(id).update(updateData);

    const doc = await adminDb.collection('teachers').doc(id).get();
    return NextResponse.json({ success: true, teacher: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleApiError(error);
  }
}

