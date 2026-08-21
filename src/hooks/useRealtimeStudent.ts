import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/lib/store';

export function useRealtimeStudent(studentId: string) {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ percentage: 0, total: 0, present: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    let unsubClasses: () => void;
    let unsubAssignments: () => void;
    let unsubEnrollments: () => void;
    let unsubBadges: () => void;
    let unsubAttendance: () => void;

    // 1. Enrollments
    const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', studentId), where('status', '==', 'active'));
    unsubEnrollments = onSnapshot(enrollQ, async (snap) => {
      const enrolls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Populate course details
      const populated = await Promise.all(enrolls.map(async (e: any) => {
        if (e.courseId) {
          const cDoc = await getDoc(doc(db, 'courses', e.courseId));
          if (cDoc.exists()) e.course = { id: cDoc.id, ...cDoc.data() };
        }
        return e;
      }));
      setEnrollments(populated);

      // Now fetch classes based on these courseIds
      const courseIds = populated.map(e => e.courseId).filter(Boolean);
      if (courseIds.length > 0) {
        // Simple client-side query (Firebase 'in' supports max 10)
        // For production with many courses, multiple queries or server-side filtering is better
        const classQ = query(collection(db, 'classes'), where('courseId', 'in', courseIds.slice(0, 10)));
        unsubClasses = onSnapshot(classQ, (cSnap) => {
          const cls = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setClasses(cls);
        });
      } else {
        setClasses([]);
      }
    });

    // 2. Assignments and Submissions
    unsubAssignments = onSnapshot(collection(db, 'assignments'), (assignSnap) => {
      const allAssignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const subQ = query(collection(db, 'assignment_submissions'), where('studentId', '==', studentId));
      onSnapshot(subQ, (subSnap) => {
        const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const merged = allAssignments.map(a => {
          const submission = subs.find((s: any) => s.assignmentId === a.id);
          return { ...a, submission };
        });
        setAssignments(merged);
      });
    });

    // 3. Badges
    const badgeQ = query(collection(db, 'badges'), where('studentId', '==', studentId));
    unsubBadges = onSnapshot(badgeQ, (snap) => {
      setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Attendance
    const attendQ = query(collection(db, 'attendance'), where('studentId', '==', studentId));
    unsubAttendance = onSnapshot(attendQ, (snap) => {
      const records = snap.docs.map(d => d.data());
      const total = records.length;
      const present = records.filter(r => r.present === true).length;
      setAttendanceStats({
        total,
        present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      });
      setLoading(false); // Mark loading complete after attendance resolves
    });

    return () => {
      unsubEnrollments?.();
      unsubClasses?.();
      unsubAssignments?.();
      unsubBadges?.();
      unsubAttendance?.();
    };
  }, [studentId]);

  return { classes, assignments, enrollments, badges, attendanceStats, loading };
}
