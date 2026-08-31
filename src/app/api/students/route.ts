import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { verifyToken, handleApiError, AuthError, requireRole } from '@/lib/verifyToken';
import { z } from 'zod';

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

// ✅ FIX: Add validation schema for student updates
const AllowedStudentUpdates: Record<string, string[]> = {
  student: ['name', 'phone', 'bio', 'photo', 'dateOfBirth'],
  parent: ['name', 'phone'],
  admin: ['name', 'email', 'phone', 'isActive', 'role', 'parentId', 'points'],
};

const UpdateStudentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  photo: z.string().url().optional(),
  dateOfBirth: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  role: z.string().optional(),
  parentId: z.string().optional(),
  points: z.number().min(0).optional(),
});

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

    // Admin, parent, or teacher get all students
    const studentsSnap = await adminDb.collection('students').get();
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
    // ✅ FIX #2: requireRole is now imported
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
    return NextResponse.json({ success: false, message: 'Internal server error', error: String(error), stack: error?.stack }, { status: 500 });
  }
}

// ✅ FIX: Add field-level authorization and validation
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

    if (!['admin', 'student', 'parent'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // ✅ Validate input
    const validated = UpdateStudentSchema.parse(updateData);

    // ✅ Filter to allowed fields for this role
    const allowedFields = AllowedStudentUpdates[user.role] || [];
    const safeUpdates: Record<string, any> = {};

    for (const [key, value] of Object.entries(validated)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add timestamp
    safeUpdates.updatedAt = new Date().toISOString();

    await adminDb.collection('students').doc(id).update(safeUpdates);
    await adminDb.collection('users').doc(id).update(safeUpdates);

    const doc = await adminDb.collection('students').doc(id).get();
    return NextResponse.json({ success: true, student: { id: doc.id, ...doc.data() } });
  } catch (error) {
    // ✅ Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, message: 'Internal server error', error: String(error), stack: error?.stack }, { status: 500 });
  }
}
