import { adminDb } from '@/lib/firebaseAdmin';
import { handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';

function toObj(doc: { id: string; data(): Record<string, unknown> }) {
  const d = doc.data();
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

// GET leaderboard — top students by points, optionally filtered by ?courseId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let studentIds: string[] | null = null;

    // If courseId is provided, get enrolled student IDs
    if (courseId) {
      const enrollmentsSnap = await adminDb
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .get();
      studentIds = enrollmentsSnap.docs
        .map((e) => e.data())
        .filter((e) => e.status === 'active')
        .map((e) => e.studentId as string)
        .filter(Boolean);
    }

    // Fetch all students
    const studentsSnap = await adminDb
      .collection('students')
      .orderBy('points', 'desc')
      .limit(50)
      .get();

    const allStudents = studentsSnap.docs.map(toObj);

    // Filter by enrolled student IDs if courseId was provided
    const filtered = courseId
      ? allStudents.filter((s) => studentIds!.includes(s.id))
      : allStudents;

    // Fetch badge counts for the filtered students
    const leaderboard = await Promise.all(
      filtered.slice(0, 10).map(async (student, index) => {
        const badgesSnap = await adminDb
          .collection('badges')
          .where('studentId', '==', student.id)
          .get();

        return {
          rank: index + 1,
          id: student.id,
          name: student.name,
          points: student.points || 0,
          badgesCount: badgesSnap.size,
          grade: student.grade || null,
        };
      })
    );

    const now = new Date();
    return NextResponse.json({
      success: true,
      leaderboard,
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
