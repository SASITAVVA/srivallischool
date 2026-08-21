import { adminDb } from '@/lib/firebaseAdmin';
import { verifyToken, requireRole, handleApiError, verifyStudentAccess } from '@/lib/verifyToken';
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

// GET quizzes — optional courseId filter
export async function GET(req: Request) {
  try {
    const user = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    
    let allowedCourses: string[] = [];
    if (user.role === 'student') {
      allowedCourses = await verifyStudentAccess(user.uid, courseId || undefined);
    }

    let query: any = adminDb.collection('quizzes').where('isActive', '==', true);

    if (user.role === 'student') {
      if (allowedCourses.length === 0) return NextResponse.json({ success: true, quizzes: [] });
      query = query.where('courseId', 'in', allowedCourses.slice(0, 30));
    }

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    const snapshot = await query.get();
    let quizzes = snapshot.docs.map(toObj);
    
    // Sort in memory to avoid composite index error
    quizzes.sort((a, b) => {
      const dateA = a.createdAt as string || '';
      const dateB = b.createdAt as string || '';
      return dateB.localeCompare(dateA);
    });

    if (user.role === 'admin' || user.role === 'teacher') {
      const attemptsSnap = await adminDb.collection('quizAttempts').get();
      const attempts = attemptsSnap.docs.map(toObj);
      
      const studentsSnap = await adminDb.collection('students').get();
      const studentMap: Record<string, any> = {};
      studentsSnap.docs.forEach(doc => {
        studentMap[doc.id] = { id: doc.id, ...doc.data() };
      });

      quizzes = quizzes.map(quiz => ({
        ...quiz,
        attempts: attempts
          .filter(a => a.quizId === quiz.id)
          .map(a => ({
            ...a,
            studentName: studentMap[a.studentId as string]?.name || 'Unknown'
          }))
      }));
    }

    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create quiz or submit quiz attempt
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // If quizId is present, it's a quiz attempt submission
    if (body.quizId) {
      const { quizId, studentId, answers, timeTaken } = body;

      if (!quizId || !studentId || !answers) {
        return NextResponse.json(
          { success: false, message: 'quizId, studentId, and answers are required' },
          { status: 400 }
        );
      }

      // Verify quiz exists
      const quizDoc = await adminDb.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Parse quiz questions to calculate score
      let score = 0;
      let total = 0;
      const quizData = quizDoc.data()!;

      try {
        const questions = JSON.parse(quizData.questions as string);
        const studentAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;

        total = questions.length;
        questions.forEach((q: { correctAnswer?: string | number }, index: number) => {
          if (q.correctAnswer !== undefined && studentAnswers[index] === q.correctAnswer) {
            score++;
          }
        });
      } catch {
        // If we can't parse, store without score
      }

      const percentage = total > 0 ? (score / total) * 100 : 0;

      const attemptRef = await adminDb.collection('quizAttempts').add({
        quizId,
        studentId,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
        score,
        total,
        percentage,
        timeTaken: timeTaken ?? 0,
        createdAt: FieldValue.serverTimestamp(),
      });

      const attemptDoc = await attemptRef.get();
      const attempt = toObj(attemptDoc!);

      return NextResponse.json({ success: true, attempt }, { status: 201 });
    }

    // Otherwise it's a quiz creation — require admin or teacher role
    await requireRole(req, ['admin', 'teacher']);

    const { courseId, teacherId, title, description, timeLimit, questions } = body;

    if (!title || !questions) {
      return NextResponse.json(
        { success: false, message: 'Title and questions are required' },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection('quizzes').add({
      courseId,
      teacherId,
      title,
      description,
      timeLimit,
      questions: typeof questions === 'string' ? questions : JSON.stringify(questions),
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    const quiz = toObj(doc!);

    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(req, ['admin', 'teacher'])
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Quiz ID is required' }, { status: 400 })
    }

    await adminDb.collection('quizzes').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

