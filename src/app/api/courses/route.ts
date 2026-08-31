import { adminDb } from '@/lib/firebaseAdmin'
import { requireRole, handleApiError } from '@/lib/verifyToken'
import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic';

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

// GET all active courses (public)
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('courses')
      .where('isActive', '==', true)
      .get()

    const courses = snapshot.docs.map(docToObj)
    courses.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })

    return NextResponse.json({ success: true, courses })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create course (admin only)
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin'])

    const { title, description, tagline, weeklyFee, monthlyFee, duration, category, topics, activities } =
      await req.json()

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      )
    }

    const docRef = await adminDb.collection('courses').add({
      title,
      description,
      tagline: tagline || null,
      weeklyFee: weeklyFee ?? null,
      monthlyFee: monthlyFee ?? null,
      duration: duration ?? null,
      category: category ?? null,
      topics: topics ?? [],
      activities: activities ?? [],
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const course = docToObj(await docRef.get())

    return NextResponse.json({ success: true, course }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update course (admin only)
export async function PUT(req: Request) {
  try {
    await requireRole(req, ['admin'])

    const { id, title, description, tagline, weeklyFee, monthlyFee, duration, category, topics, activities, isActive } =
      await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 })
    }

    const docRef = adminDb.collection('courses').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    const updateData: any = { updatedAt: FieldValue.serverTimestamp() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (tagline !== undefined) updateData.tagline = tagline
    if (weeklyFee !== undefined) updateData.weeklyFee = weeklyFee
    if (monthlyFee !== undefined) updateData.monthlyFee = monthlyFee
    if (duration !== undefined) updateData.duration = duration
    if (category !== undefined) updateData.category = category
    if (topics !== undefined) updateData.topics = topics
    if (activities !== undefined) updateData.activities = activities
    if (isActive !== undefined) updateData.isActive = isActive

    await docRef.update(updateData)

    return NextResponse.json({ success: true, message: 'Course updated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE course (admin only)
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
      return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 })
    }

    const docRef = adminDb.collection('courses').doc(id)
    const doc = await docRef.get()
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    await docRef.delete()

    return NextResponse.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

