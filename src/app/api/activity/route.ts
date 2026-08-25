import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyToken, verifyStudentAccess } from '@/lib/verifyToken';

export async function POST(req: Request) {
  try {
    const { eventType, courseId, courseName, sessionId, metadata } = await req.json();

    if (!eventType) {
      return NextResponse.json({ success: false, message: 'eventType is required' }, { status: 400 });
    }

    // Attempt to identify user
    let uid = null;
    let userRole = null;
    let userName = null;
    let userEmail = null;

    try {
      const user = await verifyToken(req);
      uid = user.uid;
      userRole = user.role;
      userName = user.name;
      userEmail = user.email;
    } catch {
      // Not authenticated, that's fine. We will use the anonymous sessionId.
    }

    
    // Verify user has access to this course (Security Audit Request)
    if (userRole === 'student' && courseId) {
      try {
        await verifyStudentAccess(uid, courseId);
      } catch (err) {
        return NextResponse.json({ success: false, message: 'No access' }, { status: 403 });
      }
    }

    const activityData = {
      eventType, // e.g., 'Course Viewed', 'Demo Booked', 'Course Details Opened'
      courseId: courseId || null,
      courseName: courseName || null,
      uid: uid || null,
      userRole,
      userName,
      userEmail,
      sessionId: sessionId || 'anonymous',
      metadata: metadata || {},
      timestamp: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('activity').add(activityData);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Activity tracking error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record activity' },
      { status: 500 }
    );
  }
}
