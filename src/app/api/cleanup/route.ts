import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { verifyToken } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await verifyToken(req);
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const safeEmails = ['cvxv@gmail.com', 'vc@gmail.com', 'lakshmi@gmail.com', 'admin@srivallischool.com'];
    
    // Get all users
    const usersSnap = await adminDb.collection('users').get();
    const toDeleteUids: string[] = [];

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      if (data.role === 'admin') continue;
      if (data.email && (data.email.endsWith('@parent.com') || data.email.endsWith('.test') || data.isTestData)) { toDeleteUids.push(doc.id); }
    }

    // Also get any students/parents/teachers that might not be in users collection
    const extraCols = ['students', 'parents', 'teachers'];
    for (const col of extraCols) {
      const snap = await adminDb.collection(col).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        if (!toDeleteUids.includes(doc.id) && data.role !== 'admin' && data.email && (data.email.endsWith('@parent.com') || data.email.endsWith('.test') || data.isTestData)) { toDeleteUids.push(doc.id); }
      }
    }

    // Delete users
    for (const uid of toDeleteUids) {
      await adminDb.collection('users').doc(uid).delete().catch(() => {});
      await adminDb.collection('students').doc(uid).delete().catch(() => {});
      await adminDb.collection('parents').doc(uid).delete().catch(() => {});
      await adminDb.collection('teachers').doc(uid).delete().catch(() => {});
      try { await adminAuth.deleteUser(uid); } catch (e) {}
    }

    // Delete sub-data
    const dataCols = ['enrollments', 'attendance', 'badges', 'payments', 'certificates', 'leaderboard', 'teacherAssignments'];
    for (const col of dataCols) {
      const snap = await adminDb.collection(col).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        // if it belongs to a deleted user
        if (
          (data.studentId && toDeleteUids.includes(data.studentId)) ||
          (data.parentId && toDeleteUids.includes(data.parentId)) ||
          (data.teacherId && toDeleteUids.includes(data.teacherId))
        ) {
          await doc.ref.delete().catch(() => {});
        } else if (col === 'enrollments' && data.courseId === 'yOwx7TCldJakJEkMDhJp') {
          await doc.ref.delete().catch(() => {}); // Explicitly delete the ghost course enrollments
        }
      }
    }

    return NextResponse.json({ success: true, message: `Deleted ${toDeleteUids.length} fake accounts and their data.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
