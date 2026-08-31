import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError, verifyToken } from '@/lib/verifyToken';
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

// GET all demo requests (admin only)
export async function GET(req: Request) {
  try {
    await requireRole(req, ['admin']);

    const snapshot = await adminDb
      .collection('demoRequests')
      .orderBy('createdAt', 'desc')
      .get();

    const demoRequests = snapshot.docs.map(toObj);

    return NextResponse.json({
      success: true,
      demoRequests,
      total: demoRequests.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create demo request (public, no auth required)
export async function POST(req: Request) {
  try {
    const { parentName, childName, childAge, mobile, email, preferredDate, preferredTime, courseInterest, message } = await req.json();

    // Since Contact Us form doesn't send childName/childAge, make them optional
    if (!parentName || !mobile) {
      return NextResponse.json(
        { success: false, message: 'parentName and mobile are required' },
        { status: 400 }
      );
    }

    let uid = null;
    try {
      const user = await verifyToken(req);
      uid = user.uid;
    } catch {
      // Unauthenticated is fine
    }

    const docRef = await adminDb.collection('demoRequests').add({
      parentName,
      childName: childName || null,
      childAge: childAge || null,
      mobile,
      email: email || null,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      courseInterest: courseInterest || null,
      message: message || null,
      status: 'New', // Default status as requested
      uid, // Associate with logged in user if available
      createdAt: FieldValue.serverTimestamp(),
    });

    const demoRequest = toObj(await docRef.get());

    return NextResponse.json({ success: true, demoRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT update demo request status (admin only)
export async function PUT(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status required' }, { status: 400 });
    }

    const docRef = adminDb.collection('demoRequests').doc(id);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    await docRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE demo request
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
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('demoRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

