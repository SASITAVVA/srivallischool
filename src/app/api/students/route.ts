import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { verifyToken, handleApiError, AuthError } from '@/lib/verifyToken';

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

// GET all students or GET by ?id= with enrollments, attendance stats, points
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Get student by id
      const studentDoc = await adminDb.collection('students').doc(id).get();
      if (!studentDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'Student not found' },
          { status: 404 }
        );
      }

      const student = toObj(studentDoc);

      // Authorization checks
      if (user.role === 'student' && user.uid !== id) {
        throw new AuthError('Forbidden: Can only access your own profile.', 403);
      }
      if (user.role === 'parent' && student.parentId !== user.uid) {
        throw new AuthError('Forbidden: Not authorized to view this student.', 403);
      }

      // Fetch enrollments for this student
      const enrollmentsSnap = await adminDb
        .collection('enrollments')
        .where('studentId', '==', id)
        .get();
      const enrollments = enrollmentsSnap.docs.map(toObj);

      // Fetch badges for this student
      const badgesSnap = await adminDb
        .collection('badges')
        .where('studentId', '==', id)
        .get();
      const earnedBadges = badgesSnap.docs.map(toObj);

      // Compute attendance stats
      const attendanceSnap = await adminDb
        .collection('attendance')
        .where('studentId', '==', id)
        .get();
      const attendanceRecords = attendanceSnap.docs.map((a) => a.data());
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((r) => r.present === true).length;
      const attendanceStats = {
        total: totalClasses,
        present: presentCount,
        absent: totalClasses - presentCount,
        percentage: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0,
      };

      return NextResponse.json({
        success: true,
        student: { ...student, enrollments, earnedBadges },
        attendanceStats,
        points: student.points || 0,
      });
    }

    // Get all students
    if (user.role === 'teacher') {
      // 1. Get courses assigned to this teacher
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []).filter(Boolean))];
      
      if (courseIds.length === 0) {
        return NextResponse.json({ success: true, students: [] });
      }

      // 2. Get active enrollments for these courses
      const studentIds = new Set<string>();
      // Firestore 'in' queries support max 30 items
      for (let i = 0; i < courseIds.length; i += 30) {
        const chunk = courseIds.slice(i, i + 30);
        const enrollmentsSnap = await adminDb.collection('enrollments')
          .where('courseId', 'in', chunk)
          .where('status', '==', 'active')
          .get();
        enrollmentsSnap.docs.forEach(d => studentIds.add(d.data().studentId));
      }

      const idArray = Array.from(studentIds);
      if (idArray.length === 0) {
        return NextResponse.json({ success: true, students: [] });
      }

      // 3. Fetch the students
      let students: any[] = [];
      for (let i = 0; i < idArray.length; i += 30) {
        const chunk = idArray.slice(i, i + 30);
        // Using document IDs requires FieldPath.documentId() in SDK, 
        // simpler approach: since id is stored as doc.id, we can fetch in parallel
        const docs = await Promise.all(chunk.map(sid => adminDb.collection('students').doc(sid).get()));
        students = students.concat(docs.filter(d => d.exists).map(toObj));
      }

      return NextResponse.json({ success: true, students });
    }

    if (user.role !== 'admin') {
      throw new AuthError('Forbidden: Only teachers and admins can view the student directory.', 403);
    }

    const studentsSnap = await adminDb.collection('students').orderBy('createdAt', 'desc').get();
    const students = studentsSnap.docs.map(toObj);
    
    // Fetch all enrollments to attach to students
    const enrollmentsSnap = await adminDb.collection('enrollments').get();
    const allEnrollments = enrollmentsSnap.docs.map(toObj);
    
    students.forEach(student => {
      student.enrollments = allEnrollments.filter(e => e.studentId === student.id);
    });

    return NextResponse.json({ success: true, students });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Student ID is required' }, { status: 400 });
    }

    try {
      await adminAuth.deleteUser(id);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.error('Firebase Auth delete error:', authErr);
      }
    }

    await adminDb.collection('students').doc(id).delete();
    await adminDb.collection('users').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
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
      return NextResponse.json({ success: false, message: 'Student ID is required' }, { status: 400 });
    }

    if (user.role === 'student' && user.uid !== id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (user.role !== 'admin' && user.role !== 'student' && user.role !== 'parent') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('students').doc(id).update(updateData);
    await adminDb.collection('users').doc(id).update(updateData);

    const doc = await adminDb.collection('students').doc(id).get();
    return NextResponse.json({ success: true, student: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return handleApiError(error);
  }
}

