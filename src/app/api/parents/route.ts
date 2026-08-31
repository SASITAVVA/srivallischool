import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { verifyToken, requireRole, handleApiError, AuthError } from '@/lib/verifyToken';

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

// GET all parents or GET by ?id= with children
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      if (user.role === 'parent' && user.uid !== id) {
        throw new AuthError('Forbidden: Can only access your own parent profile.', 403);
      }
      if (user.role === 'student') {
        throw new AuthError('Forbidden: Students cannot query parent profiles.', 403);
      }

      const parentDoc = await adminDb.collection('parents').doc(id).get();
      if (!parentDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'Parent not found' },
          { status: 404 }
        );
      }

      const parent = toObj(parentDoc);

      // Fetch children (students where parentId matches)
      const studentsSnap = await adminDb
        .collection('students')
        .where('parentId', '==', id)
        .get();
      const students = studentsSnap.docs.map(toObj);

      // Fetch payments for this parent
      const paymentsSnap = await adminDb
        .collection('payments')
        .where('parentId', '==', id)
        .get();
      const payments = paymentsSnap.docs.map(toObj);

      // Remove password from parent if present
      const { password: _, ...safeParent } = parent;

      return NextResponse.json({
        success: true,
        parent: safeParent,
        students,
        payments,
      });
    }

    // Get all parents (Admins only for privacy)
    if (user.role !== 'admin') {
      throw new AuthError('Forbidden: Only admins can view the parent directory.', 403);
    }

    const parentsSnap = await adminDb
      .collection('parents')
      .orderBy('createdAt', 'desc')
      .get();
    const parentsDocs = parentsSnap.docs;

    // For each parent, fetch their children (id, name, grade only)
    const parents = await Promise.all(
      parentsDocs.map(async (doc) => {
        const parent = toObj(doc);
        const { password: _, ...safeParent } = parent;

        const childrenSnap = await adminDb
          .collection('students')
          .where('parentId', '==', doc.id)
          .select('id', 'name', 'grade')
          .get();
        const students = childrenSnap.docs.map((c) => {
          const d = c.data();
          return {
            id: c.id,
            name: d.name ?? null,
            grade: d.grade ?? null,
          };
        });

        return { ...safeParent, students };
      })
    );

    return NextResponse.json({ success: true, parents });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }
    if (!id) {
      return NextResponse.json({ success: false, message: 'Parent ID is required' }, { status: 400 });
    }

    try {
      await adminAuth.deleteUser(id);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.error('Firebase Auth delete error:', authErr);
      }
    }

    await adminDb.collection('parents').doc(id).delete();
    await adminDb.collection('users').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Parent deleted successfully' });
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
      return NextResponse.json({ success: false, message: 'Parent ID is required' }, { status: 400 });
    }

    if (user.role === 'parent' && user.uid !== id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (user.role !== 'admin' && user.role !== 'parent') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('parents').doc(id).update(updateData);
    await adminDb.collection('users').doc(id).update(updateData);

    const doc = await adminDb.collection('parents').doc(id).get();
    return NextResponse.json({ success: true, parent: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleApiError(error);
  }
}

