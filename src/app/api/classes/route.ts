import { adminDb } from '@/lib/firebaseAdmin'
import { verifyToken, requireRole, handleApiError } from '@/lib/verifyToken'
import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'

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

/** Populate course and teacher references on an array of class objects */
async function populateClasses(classObjs: any[]): Promise<any[]> {
  const courseIds = [...new Set(classObjs.map((c: any) => c.courseId).filter(Boolean))]
  const teacherIds = [...new Set(classObjs.map((c: any) => c.teacherId).filter(Boolean))]

  // Fetch all referenced courses in parallel
  const [courseSnaps, teacherSnaps] = await Promise.all([
    courseIds.length > 0
      ? Promise.all(courseIds.map(id => adminDb.collection('courses').doc(id).get()))
      : Promise.resolve([]),
    teacherIds.length > 0
      ? Promise.all(teacherIds.map(id => adminDb.collection('users').doc(id).get()))
      : Promise.resolve([]),
  ])

  const courseMap: Record<string, any> = {}
  courseSnaps.forEach(snap => {
    if (snap.exists) courseMap[snap.id] = docToObj(snap)
  })

  const teacherMap: Record<string, any> = {}
  teacherSnaps.forEach(snap => {
    if (snap.exists) teacherMap[snap.id] = docToObj(snap)
  })

  return classObjs.map(cls => ({
    ...cls,
    course: courseMap[cls.courseId] || null,
    teacher: teacherMap[cls.teacherId] || null,
  }))
}

// GET classes — supports optional query: courseId, studentId, upcoming
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req)
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const studentId = searchParams.get('studentId')
    const upcoming = searchParams.get('upcoming')

    // Role-based authorization
    if (user.role === 'student') {
      await verifyStudentAccess(user.uid, courseId || undefined);
      if (!studentId || user.uid !== studentId) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
      }
    } else if (user.role === 'parent') {
      if (!studentId) {
        return NextResponse.json({ success: false, message: 'studentId required for parents' }, { status: 403 })
      }
      const studentDoc = await adminDb.collection('students').doc(studentId).get()
      if (!studentDoc.exists || studentDoc.data()?.parentId !== user.uid) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
      }
    }

    let query = adminDb.collection('classes')

    // If studentId is provided, first look up active enrollments to get courseIds
    if (studentId) {
      let enrollmentQuery = adminDb
        .collection('enrollments')
        .where('studentId', '==', studentId)
        .where('status', '==', 'active')

      if (courseId) {
        enrollmentQuery = enrollmentQuery.where('courseId', '==', courseId)
      }

      const enrollmentSnap = await enrollmentQuery.get()
      const courseIds = [...new Set(enrollmentSnap.docs.map(d => d.data().courseId).filter(Boolean))]

      if (courseIds.length === 0) {
        return NextResponse.json({ success: true, classes: [] })
      }

      // Firestore 'in' queries support up to 30 values
      const chunks: string[][] = []
      for (let i = 0; i < courseIds.length; i += 30) {
        chunks.push(courseIds.slice(i, i + 30))
      }

      const allDocs = await Promise.all(
        chunks.map(chunk => {
          let q = adminDb.collection('classes').where('courseId', 'in', chunk)
          if (upcoming === 'true') {
            const todayStr = new Date().toISOString().split('T')[0]
            q = q.where('date', '>=', todayStr)
          }
          return q.get()
        })
      )

      let classDocs = allDocs.flatMap(snap => snap.docs)

      // If courseId query param was also given, extra-filter (already handled in enrollment query but be safe)
      if (courseId) {
        classDocs = classDocs.filter(d => d.data().courseId === courseId)
      }

      const classObjs = classDocs.map(docToObj)
      
      // Sort in JS to avoid composite index requirement
      classObjs.sort((a, b) => {
        if (a.date === b.date) return (a.time || '').localeCompare(b.time || '')
        return (a.date || '').localeCompare(b.date || '')
      })
      
      const classes = await populateClasses(classObjs)

      return NextResponse.json({ success: true, classes })
    }

    // No studentId — standard filters
    if (courseId) {
      query = query.where('courseId', '==', courseId)
    }

    if (upcoming === 'true') {
      const todayStr = new Date().toISOString().split('T')[0]
      query = query.where('date', '>=', todayStr)
    }

    const snapshot = await query.get()
    const classObjs = snapshot.docs.map(docToObj)
    
    // Sort in JS to avoid composite index requirement
    classObjs.sort((a, b) => {
      if (a.date === b.date) return (a.time || '').localeCompare(b.time || '')
      return (a.date || '').localeCompare(b.date || '')
    })
    
    const classes = await populateClasses(classObjs)

    return NextResponse.json({ success: true, classes })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create class (admin or teacher)
export async function POST(req: Request) {
  try {
    const user = await verifyToken(req)
    await requireRole(req, ['admin', 'teacher'])

    const { courseId, teacherId, title, date, time, duration, meetingLink } = await req.json()

    if (!courseId || !title || !date || !time) {
      return NextResponse.json(
        { success: false, message: 'CourseId, title, date, and time are required' },
        { status: 400 }
      )
    }

    if (user.role === 'teacher') {
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []))];
      if (!courseIds.includes(courseId)) {
        return NextResponse.json({ success: false, message: 'Forbidden: You are not assigned to this course.' }, { status: 403 });
      }
    }

    // Verify course exists
    const courseSnap = await adminDb.collection('courses').doc(courseId).get()
    if (!courseSnap.exists) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    const docRef = await adminDb.collection('classes').add({
      courseId,
      teacherId: teacherId || null,
      title,
      date,
      time,
      duration: duration ?? null,
      meetingLink: meetingLink || null,
      status: 'scheduled',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const newClass = docToObj(await docRef.get())

    return NextResponse.json({ success: true, class: newClass }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update class status (admin or teacher)
export async function PUT(req: Request) {
  try {
    const user = await verifyToken(req)
    await requireRole(req, ['admin', 'teacher'])

    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'Class id and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const classRef = adminDb.collection('classes').doc(id)
    const classSnap = await classRef.get()

    if (!classSnap.exists) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    if (user.role === 'teacher') {
      const classData = classSnap.data();
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []))];
      if (!courseIds.includes(classData?.courseId)) {
        return NextResponse.json({ success: false, message: 'Forbidden: You are not assigned to this course.' }, { status: 403 });
      }
    }

    await classRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updatedClass = docToObj(await classRef.get())

    return NextResponse.json({ success: true, class: updatedClass })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await verifyToken(req)
    await requireRole(req, ['admin', 'teacher'])
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Class ID is required' }, { status: 400 })
    }

    const classRef = adminDb.collection('classes').doc(id)
    const classSnap = await classRef.get()

    if (!classSnap.exists) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 })
    }

    if (user.role === 'teacher') {
      const classData = classSnap.data();
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []))];
      if (!courseIds.includes(classData?.courseId)) {
        return NextResponse.json({ success: false, message: 'Forbidden: You are not assigned to this course.' }, { status: 403 });
      }
    }

    await classRef.delete()

    return NextResponse.json({ success: true, message: 'Class deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

