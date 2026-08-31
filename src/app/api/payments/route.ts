import { adminDb } from '@/lib/firebaseAdmin';
import { verifyToken, requireRole, handleApiError } from '@/lib/verifyToken';
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

async function populatePayments(payments: any[]) {
  const enrollmentIds = [...new Set(payments.map(p => p.enrollmentId).filter(Boolean))];
  if (enrollmentIds.length === 0) return payments;

  const enrollSnaps = await Promise.all(
    enrollmentIds.map(id => adminDb.collection('enrollments').doc(id).get())
  );

  const enrollMap: Record<string, any> = {};
  const courseIds: string[] = [];

  for (const snap of enrollSnaps) {
    if (snap.exists) {
      const data = toObj(snap);
      enrollMap[snap.id] = data;
      if (data.courseId) courseIds.push(data.courseId);
    }
  }

  const uniqueCourseIds = [...new Set(courseIds)];
  const courseSnaps = await Promise.all(
    uniqueCourseIds.map(id => adminDb.collection('courses').doc(id).get())
  );

  const courseMap: Record<string, any> = {};
  courseSnaps.forEach(snap => {
    if (snap.exists) courseMap[snap.id] = toObj(snap);
  });

  for (const id of Object.keys(enrollMap)) {
    const enroll = enrollMap[id];
    if (enroll.courseId) {
      enroll.course = courseMap[enroll.courseId] || null;
    } else {
      enroll.course = null;
    }
  }

  return payments.map(p => ({
    ...p,
    enrollment: enrollMap[p.enrollmentId as string] || { status: 'unknown', course: null },
  }));
}

// GET payments by ?parentId
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { success: false, message: 'parentId query parameter is required' },
        { status: 400 }
      );
    }

    if (user.role === 'parent' && user.uid !== parentId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    } else if (user.role === 'student') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('payments')
      .where('parentId', '==', parentId)
      .get();

    let paymentsObjs = snapshot.docs.map(toObj);
    paymentsObjs.sort((a, b) => {
      const dateA = a.createdAt as string || '';
      const dateB = b.createdAt as string || '';
      return dateB.localeCompare(dateA);
    });

    const payments = await populatePayments(paymentsObjs);

    // Summary stats
    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount as number), 0);
    const totalPending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount as number), 0);

    return NextResponse.json({
      success: true,
      payments,
      summary: {
        totalPaid,
        totalPending,
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create payment
export async function POST(req: Request) {
  try {
    const user = await requireRole(req, ['admin', 'parent']);
    const { enrollmentId, amount, plan, method, parentId } = await req.json();

    if (!enrollmentId || !amount || !plan) {
      return NextResponse.json(
        { success: false, message: 'enrollmentId, amount, and plan are required' },
        { status: 400 }
      );
    }

    // Verify enrollment exists
    const enrollmentDoc = await adminDb.collection('enrollments').doc(enrollmentId).get();
    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Generate a transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const docRef = await adminDb.collection('payments').add({
      parentId: parentId || user.uid,
      enrollmentId,
      amount,
      plan,
      method: method || null,
      transactionId,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });

    const payment = toObj(await docRef.get());

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE payment
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
      return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('payments').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

