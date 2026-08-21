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

// GET notifications by ?userId
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'teacher' && user.uid !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    const notifications = snapshot.docs.map(toObj);
    
    // Sort in memory to avoid composite index error
    notifications.sort((a, b) => {
      const dateA = a.createdAt as string || '';
      const dateB = b.createdAt as string || '';
      return dateB.localeCompare(dateA);
    });
    const unreadCount = notifications.filter((n) => n.read !== true).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create notification (for a single user or broadcast to multiple users)
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher']);
    const { userId, title, message, type, userIds } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required' },
        { status: 400 }
      );
    }

    const validType = type && ['info', 'success', 'warning'].includes(type) ? type : 'info';

    // Single user notification
    if (userId) {
      const docRef = await adminDb.collection('notifications').add({
        userId,
        title,
        message,
        type: validType,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      const notification = toObj(await docRef.get());
      return NextResponse.json({ success: true, notification }, { status: 201 });
    }

    // Broadcast to multiple users
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const batch = adminDb.batch();
      const refs = [];

      for (const uid of userIds) {
        const ref = adminDb.collection('notifications').doc();
        batch.set(ref, {
          userId: uid,
          title,
          message,
          type: validType,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
        refs.push(ref);
      }

      await batch.commit();

      const notifications = await Promise.all(refs.map((ref) => ref.get()));
      return NextResponse.json(
        { success: true, notifications: notifications.map(toObj), count: refs.length },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'userId or userIds array is required' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT mark notification as read
export async function PUT(req: Request) {
  try {
    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'notificationId is required' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    await docRef.update({ read: true });

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return handleApiError(error);
  }
}
