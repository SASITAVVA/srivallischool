import { adminDb } from '@/lib/firebaseAdmin'
import { verifyToken, requireRole, handleApiError } from '@/lib/verifyToken'
import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

/** Recursively convert Firestore Timestamps to ISO strings */
function convertTimestamps(data: any): any {
  if (data == null || typeof data !== 'object') return data
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString()
  }
  if (Array.isArray(data)) return data.map(convertTimestamps)
  const result: Record<string, any> = {}
  for (const key of Object.keys(data)) {
    result[key] = convertTimestamps(data[key])
  }
  return result
}

/** Convert a Firestore document snapshot to a plain object with id */
function docToObj<T = Record<string, any>>(doc: { id: string; data(): T }): T & { id: string } {
  return convertTimestamps({ id: doc.id, ...doc.data() })
}

/** Populate course and payments references on enrollment objects */
async function populateEnrollments(enrollmentObjs: any[]): Promise<any[]> {
  const courseIds = [...new Set(enrollmentObjs.map((e: any) => e.courseId).filter(Boolean))]
  const enrollmentIds = enrollmentObjs.map((e: any) => e.id)

  // Fetch all referenced courses
  const courseSnaps = await Promise.all(
    courseIds.map(id => adminDb.collection('courses').doc(id).get())
  )
  const courseMap: Record<string, any> = {}
  courseSnaps.forEach(snap => {
    if (snap.exists) courseMap[snap.id] = docToObj(snap)
  })

  // Fetch payments for these enrollments (batch by enrollmentId)
  const paymentsMap: Record<string, any[]> = {}
  // Firestore 'in' supports up to 30 values
  const chunks: string[][] = []
  for (let i = 0; i < enrollmentIds.length; i += 30) {
    chunks.push(enrollmentIds.slice(i, i + 30))
  }
  const paymentSnaps = await Promise.all(
    chunks.map(chunk =>
      adminDb.collection('payments').where('enrollmentId', 'in', chunk).get()
    )
  )
  paymentSnaps.flatMap(snap => snap.docs).forEach(doc => {
    const enrollmentId = doc.data().enrollmentId
    if (!paymentsMap[enrollmentId]) paymentsMap[enrollmentId] = []
    paymentsMap[enrollmentId].push(docToObj(doc))
  })

  return enrollmentObjs.map(enrollment => ({
    ...enrollment,
    course: courseMap[enrollment.courseId] || null,
    payments: paymentsMap[enrollment.id] || [],
  }))
}

// ✅ FIX #1: Add validation schema
const CreateEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  plan: z.enum(['weekly', 'monthly'], {
    errorMap: () => ({ message: 'Plan must be weekly or monthly' }),
  }),
})

// POST create enrollment
// ✅ FIX #1: Add authentication and authorization
export async function POST(req: Request) {
  try {
    // ✅ Verify authentication
    const user = await verifyToken(req)

    // Parse and validate input
    const body = await req.json()
    const validated = CreateEnrollmentSchema.parse(body)
    const { studentId, courseId, plan } = validated

    // ✅ Authorization checks
    // Students can only enroll themselves
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json(
        { success: false, message: 'Can only enroll yourself in courses' },
        { status: 403 }
      )
    }

    // Parents can only enroll their children
    if (user.role === 'parent') {
      const studentDoc = await adminDb.collection('students').doc(studentId).get()
      if (!studentDoc.exists || studentDoc.data()?.parentId !== user.uid) {
        return NextResponse.json(
          { success: false, message: 'Can only enroll your children in courses' },
          { status: 403 }
        )
      }
    }

    // Only these roles can create enrollments
    if (!['admin', 'parent', 'student'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Your role cannot create enrollments' },
        { status: 403 }
      )
    }

    // Verify student exists
    const studentSnap = await adminDb.collection('students').doc(studentId).get()
    if (!studentSnap.exists) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    // Verify student is active
    if (studentSnap.data()?.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Student account is inactive' },
        { status: 403 }
      )
    }

    // Verify course exists
    const courseSnap = await adminDb.collection('courses').doc(courseId).get()
    if (!courseSnap.exists) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if already enrolled (active enrollment for this student + course)
    const existingSnap = await adminDb
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (!existingSnap.empty) {
      return NextResponse.json(
        { success: false, message: 'Student is already enrolled in this course' },
        { status: 409 }
      )
    }

    const docRef = await adminDb.collection('enrollments').add({
      studentId,
      courseId,
      plan,
      parentId: null,
      status: user.role === 'admin' ? 'active' : 'pending',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const enrollment = docToObj(await docRef.get())

    // Populate course and student for the response (matching original include shape)
    const course = courseSnap.exists ? docToObj(courseSnap) : null
    const student = studentSnap.exists
      ? { id: studentSnap.id, name: studentSnap.data().name || null }
      : null

    const populated = { ...enrollment, course, student }

    return NextResponse.json({ success: true, enrollment: populated }, { status: 201 })
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
      )
    }
    return handleApiError(error)
  }
}

// GET enrollments by studentId
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req)
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'studentId query parameter is required' },
        { status: 400 }
      )
    }

    // Role-based authorization
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'parent') {
      const studentDoc = await adminDb.collection('students').doc(studentId).get()
      if (!studentDoc.exists || studentDoc.data()?.parentId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
      }
    }

    const snapshot = await adminDb
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .get()

    const enrollmentObjs = snapshot.docs.map(docToObj)
    enrollmentObjs.sort((a, b) => {
      const dateA = a.createdAt || ''
      const dateB = b.createdAt || ''
      return dateB.localeCompare(dateA)
    })

    const enrollments = await populateEnrollments(enrollmentObjs)

    return NextResponse.json({
      success: true,
      enrollments,
      total: enrollments.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE enrollment
export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin'])
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Enrollment ID is required' }, { status: 400 })
    }

    const docRef = adminDb.collection('enrollments').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 })
    }

    await docRef.delete()

    return NextResponse.json({ success: true, message: 'Enrollment deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update enrollment status and paymentStatus
export async function PUT(req: Request) {
  try {
    await requireRole(req, ['admin'])
    const { id, status, paymentStatus } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Enrollment ID is required' }, { status: 400 })
    }

    // ✅ Validate status values
    if (status && !['pending', 'active', 'inactive', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      )
    }

    const docRef = adminDb.collection('enrollments').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 })
    }

    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() }
    if (status) updates.status = status
    if (paymentStatus) updates.paymentStatus = paymentStatus

    await docRef.update(updates)
    const updated = docToObj(await docRef.get())

    return NextResponse.json({ success: true, enrollment: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
