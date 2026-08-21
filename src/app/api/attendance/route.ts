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

/** Populate class (with nested course) references on attendance records */
async function populateAttendance(records: any[]): Promise<any[]> {
  const classIds = [...new Set(records.map((r: any) => r.classId).filter(Boolean))]

  // Fetch all referenced classes
  const classSnaps = await Promise.all(
    classIds.map(id => adminDb.collection('classes').doc(id).get())
  )

  const classMap: Record<string, any> = {}
  const courseIds: string[] = []

  for (const snap of classSnaps) {
    if (snap.exists) {
      const classData = docToObj(snap)
      classMap[snap.id] = classData
      if (classData.courseId) courseIds.push(classData.courseId)
    }
  }

  // Fetch all referenced courses
  const uniqueCourseIds = [...new Set(courseIds)]
  const courseSnaps = await Promise.all(
    uniqueCourseIds.map(id => adminDb.collection('courses').doc(id).get())
  )
  const courseMap: Record<string, any> = {}
  courseSnaps.forEach(snap => {
    if (snap.exists) courseMap[snap.id] = docToObj(snap)
  })

  // Attach course to each class in the map
  for (const classId of Object.keys(classMap)) {
    const cls = classMap[classId]
    if (cls.courseId) {
      cls.course = courseMap[cls.courseId] || null
    } else {
      cls.course = null
    }
  }

  return records.map(record => ({
    ...record,
    class: classMap[record.classId] || null,
  }))
}

// POST mark attendance for multiple students in a class
export async function POST(req: Request) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])

    const { classId, studentIds, present } = await req.json()

    if (
      !classId ||
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      typeof present !== 'boolean'
    ) {
      return NextResponse.json(
        { success: false, message: 'classId, studentIds array, and present boolean are required' },
        { status: 400 }
      )
    }

    // Verify class exists
    const classSnap = await adminDb.collection('classes').doc(classId).get()
    if (!classSnap.exists) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Upsert attendance records in parallel
    const results = await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Check if an attendance record already exists for this student+class+date
        const existingSnap = await adminDb
          .collection('attendance')
          .where('studentId', '==', studentId)
          .where('classId', '==', classId)
          .limit(1)
          .get()

        if (!existingSnap.empty) {
          // Update existing record
          const existingRef = existingSnap.docs[0].ref
          await existingRef.update({
            present,
            markedBy: user.uid,
            updatedAt: FieldValue.serverTimestamp(),
          })
          return docToObj(await existingRef.get())
        } else {
          // Create new record
          const docRef = await adminDb.collection('attendance').add({
            studentId,
            classId,
            present,
            date: todayStr,
            markedBy: user.uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
          return docToObj(await docRef.get())
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      records: results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// GET attendance by studentId or classId
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')

    if (!studentId && !classId) {
      return NextResponse.json(
        { success: false, message: 'studentId or classId query parameter is required' },
        { status: 400 }
      )
    }

    // Role-based authorization
    if (user.role === 'student') {
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

    let query = adminDb.collection('attendance')

    if (studentId) {
      query = query.where('studentId', '==', studentId)
    } else if (classId) {
      query = query.where('classId', '==', classId)
    }

    const snapshot = await query.get()
    const attendanceObjs = snapshot.docs.map(docToObj)
    
    // Sort in memory to avoid composite index error
    attendanceObjs.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });

    const attendance = await populateAttendance(attendanceObjs)

    const total = attendance.length
    const presentCount = attendance.filter(a => a.present).length

    return NextResponse.json({
      success: true,
      attendance,
      stats: {
        total,
        present: presentCount,
        absent: total - presentCount,
        percentage: total > 0 ? Math.round((presentCount / total) * 100) : 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
