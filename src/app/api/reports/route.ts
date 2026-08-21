import { adminDb } from '@/lib/firebaseAdmin';
import { requireRole, handleApiError } from '@/lib/verifyToken';
import { NextResponse } from 'next/server';

function toObj(doc: { id: string; data(): Record<string, unknown> }) {
  const d = doc.data();
  const result: Record<string, unknown> = { id: doc.id };
  for (const [k, v] of Object.entries(d)) {
    result[k] = v && typeof v === 'object' && 'toDate' in v ? (v as { toDate(): Date }).toDate().toISOString() : v;
  }
  return result;
}

/** Helper to build a map of month keys for the last 6 months */
function buildMonthlyMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    map[key] = 0;
  }
  return map;
}

/** Get month key from an ISO string or Date */
function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
}

// GET reports — ?type=registrations|enrollment|attendance|fees|revenue
export async function GET(req: Request) {
  try {
    await requireRole(req, ['admin']);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'registrations': {
        const [studentsSnap, parentsSnap, teachersSnap] = await Promise.all([
          adminDb.collection('students').get(),
          adminDb.collection('parents').get(),
          adminDb.collection('teachers').get(),
        ]);

        const totalStudents = studentsSnap.size;
        const totalParents = parentsSnap.size;
        const totalTeachers = teachersSnap.size;

        // Monthly student registrations for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRegistrations = buildMonthlyMap();
        studentsSnap.docs.forEach((doc) => {
          const d = doc.data();
          const createdAt = d.createdAt as { toDate?: () => Date } | undefined;
          if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
            const date = createdAt.toDate();
            if (date >= sixMonthsAgo) {
              const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
              if (monthlyRegistrations[key] !== undefined) {
                monthlyRegistrations[key]++;
              }
            }
          }
        });

        return NextResponse.json({
          success: true,
          type: 'registrations',
          summary: { totalStudents, totalParents, totalTeachers },
          monthlyRegistrations,
        });
      }

      case 'enrollment': {
        const enrollmentsSnap = await adminDb.collection('enrollments').get();
        const allEnrollments = enrollmentsSnap.docs.map((doc) => doc.data());

        const totalEnrollments = allEnrollments.length;
        const activeEnrollments = allEnrollments.filter((e) => e.status === 'active').length;
        const completedEnrollments = allEnrollments.filter((e) => e.status === 'completed').length;

        // Per-course enrollment counts
        const courseCounts: Record<string, number> = {};
        allEnrollments.forEach((e) => {
          const cid = e.courseId as string;
          courseCounts[cid] = (courseCounts[cid] || 0) + 1;
        });

        // Fetch course titles
        const courseIds = Object.keys(courseCounts);
        const courseData: { courseId: string; courseTitle: string; enrollmentCount: number }[] = [];

        if (courseIds.length > 0) {
          const coursesSnap = await adminDb
            .collection('courses')
            .where('__name__', 'in', courseIds.length <= 30 ? courseIds : courseIds.slice(0, 30))
            .get();

          const courseMap: Record<string, string> = {};
          coursesSnap.docs.forEach((doc) => {
            courseMap[doc.id] = (doc.data().title as string) || 'Unknown';
          });

          for (const [cid, count] of Object.entries(courseCounts)) {
            courseData.push({
              courseId: cid,
              courseTitle: courseMap[cid] || 'Unknown',
              enrollmentCount: count,
            });
          }
        }

        courseData.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

        return NextResponse.json({
          success: true,
          type: 'enrollment',
          summary: { totalEnrollments, activeEnrollments, completedEnrollments },
          byCourse: courseData,
        });
      }

      case 'attendance': {
        const attendanceSnap = await adminDb.collection('attendance').get();
        const allRecords = attendanceSnap.docs.map((doc) => doc.data());

        const totalRecords = allRecords.length;
        const presentRecords = allRecords.filter((r) => r.present === true).length;
        const overallPercentage = totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0;

        return NextResponse.json({
          success: true,
          type: 'attendance',
          summary: {
            totalRecords,
            presentRecords,
            absentRecords: totalRecords - presentRecords,
            overallPercentage,
          },
        });
      }

      case 'fees': {
        const paymentsSnap = await adminDb.collection('payments').get();
        const allPayments = paymentsSnap.docs.map((doc) => doc.data());

        const totalPayments = allPayments.length;
        const completedPayments = allPayments.filter((p) => p.status === 'completed').length;
        const pendingPayments = allPayments.filter((p) => p.status === 'pending').length;

        const totalAmount = allPayments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

        const pendingAmount = allPayments
          .filter((p) => p.status === 'pending')
          .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

        const weeklyCount = allPayments.filter((p) => p.plan === 'weekly' && p.status === 'completed').length;
        const monthlyCount = allPayments.filter((p) => p.plan === 'monthly' && p.status === 'completed').length;

        return NextResponse.json({
          success: true,
          type: 'fees',
          summary: {
            totalPayments,
            completedPayments,
            pendingPayments,
            totalCollected: totalAmount,
            totalPending: pendingAmount,
          },
          planBreakdown: { weekly: weeklyCount, monthly: monthlyCount },
        });
      }

      case 'revenue': {
        const paymentsSnap = await adminDb
          .collection('payments')
          .where('status', '==', 'completed')
          .get();

        const payments = paymentsSnap.docs.map((doc) => doc.data());

        const totalRevenue = payments.reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

        // Monthly revenue for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = buildMonthlyMap();

        payments.forEach((p) => {
          const createdAt = p.createdAt as { toDate?: () => Date } | undefined;
          if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
            const date = createdAt.toDate();
            if (date >= sixMonthsAgo) {
              const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
              if (monthlyRevenue[key] !== undefined) {
                monthlyRevenue[key] += (p.amount as number) || 0;
              }
            }
          }
        });

        // Plan revenue breakdown
        const weeklyRevenue = payments
          .filter((p) => p.plan === 'weekly')
          .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);
        const monthlyPlanRevenue = payments
          .filter((p) => p.plan === 'monthly')
          .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

        return NextResponse.json({
          success: true,
          type: 'revenue',
          summary: {
            totalRevenue,
            transactionCount: payments.length,
            averageTransactionValue: payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0,
          },
          monthlyRevenue,
          planRevenue: { weekly: weeklyRevenue, monthly: monthlyPlanRevenue },
        });
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid report type. Use: registrations, enrollment, attendance, fees, or revenue',
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
}
