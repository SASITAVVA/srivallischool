import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError, verifyToken, verifyStudentAccess } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';
import { FieldValue, DocumentSnapshot } from 'firebase-admin/firestore';

function toObj(doc: DocumentSnapshot) {
  const d = doc.data() ?? {};
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (user.role === 'student') {
      const allowedCourses = await verifyStudentAccess(user.uid, courseId || undefined);
      if (allowedCourses.length === 0) return NextResponse.json({ success: true, videos: [] });
      let query: any = adminDb.collection('studentVideos').where('studentId', '==', user.uid);
      if (courseId) query = query.where('courseId', '==', courseId);
      const snap = await query.orderBy('createdAt', 'desc').get();
      // Only return videos for courses the student is actually enrolled in
      const videos = snap.docs.map(toObj).filter((v: any) => allowedCourses.includes(v.courseId));
      return NextResponse.json({ success: true, videos });
    }

    if (user.role === 'teacher') {
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []).filter(Boolean))];

      if (courseIds.length === 0) {
        return NextResponse.json({ success: true, videos: [] });
      }

      // Firestore 'in' queries support max 30 items
      const chunks: string[][] = [];
      for (let i = 0; i < courseIds.length; i += 30) {
        chunks.push(courseIds.slice(i, i + 30));
      }

      const allDocs = await Promise.all(
        chunks.map(chunk => adminDb.collection('studentVideos').where('courseId', 'in', chunk).get())
      );

      const videos = allDocs.flatMap(snap => snap.docs.map(toObj));
      videos.sort((a: any, b: any) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

      return NextResponse.json({ success: true, videos });
    }

    if (user.role === 'admin') {
      const snap = await adminDb.collection('studentVideos').orderBy('createdAt', 'desc').get();
      return NextResponse.json({ success: true, videos: snap.docs.map(toObj) });
    }

    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyToken(req);
    if (user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Only students can submit videos' }, { status: 403 });
    }

    const { courseId, videoUrl, title, description } = await req.json();

    if (!courseId || !videoUrl) {
      return NextResponse.json({ success: false, message: 'courseId and videoUrl are required' }, { status: 400 });
    }

    // Validate enrollment
    const enrollmentSnap = await adminDb.collection('enrollments')
      .where('studentId', '==', user.uid)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (enrollmentSnap.empty) {
      return NextResponse.json({ success: false, message: 'You are not enrolled in this course' }, { status: 403 });
    }

    const docRef = await adminDb.collection('studentVideos').add({
      studentId: user.uid,
      courseId,
      videoUrl,
      title: title || '',
      description: description || '',
      status: 'Submitted',
      rating: null,
      feedback: null,
      teacherId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const newVideo = toObj(await docRef.get());
    return NextResponse.json({ success: true, video: newVideo }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await verifyToken(req);
    await requireRole(req, ['admin', 'teacher']);

    const { id, status, rating, feedback } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Video ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('studentVideos').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, message: 'Video not found' }, { status: 404 });
    }

    const videoData = docSnap.data();

    if (user.role === 'teacher') {
      const assignmentsSnap = await adminDb.collection('teacherAssignments').where('teacherId', '==', user.uid).get();
      const courseIds = [...new Set(assignmentsSnap.docs.flatMap(d => d.data().courseIds || []).filter(Boolean))];
      if (!courseIds.includes(videoData?.courseId)) {
        return NextResponse.json({ success: false, message: 'Forbidden: You are not assigned to this course.' }, { status: 403 });
      }
    }

    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };
    if (status !== undefined) {
      const validStatuses = ['Draft', 'Submitted', 'Under Review', 'Reviewed'];
      if (!validStatuses.includes(status)) {
         return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      updateData.status = status;
    }
    if (rating !== undefined) updateData.rating = rating;
    if (feedback !== undefined) updateData.feedback = feedback;
    
    // Track which teacher reviewed it
    if (user.role === 'teacher') updateData.teacherId = user.uid;

    await docRef.update(updateData);
    const updatedVideo = toObj(await docRef.get());

    return NextResponse.json({ success: true, video: updatedVideo });
  } catch (error) {
    return handleApiError(error);
  }
}
