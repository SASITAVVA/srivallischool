'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, Screen, initAuthListener } from '@/lib/store';
import { ToastContainer } from '@/components/srivalli/ToastContainer';
import { LoadingScreen } from '@/components/srivalli/LoadingScreen';

// Public pages
import {
  HomePage,
  AboutPage,
  CoursesPage,
  ContactPage,
  DemoPage,
  LoginPage,
  RegisterStudentPage,
  RegisterParentPage,
} from '@/components/srivalli/PublicPages';

// Student dashboard
import {
  StudentLayout,
  StudentDashMain,
  StudentCourses,
  StudentClasses,
  StudentAssignments,
  StudentQuizzes,
  StudentProgress,
  StudentLeaderboard,
  StudentCertificates,
  StudentProfile,
  StudentVideoSubmissions,
} from '@/components/srivalli/StudentDashboard';

// Parent dashboard
import {
  ParentLayout,
  ParentDashMain,
  ParentChildren,
  ParentClasses,
  ParentPayments,
  ParentCertificates,
  ParentProfile,
} from '@/components/srivalli/ParentDashboard';

// Teacher dashboard
import {
  TeacherLayout,
  TeacherDashMain,
  TeacherStudents,
  TeacherClasses,
  TeacherAssignments,
  TeacherQuizzes,
  TeacherReports,
  TeacherCounselling,
  TeacherProfile,
  TeacherVideoReviews,
} from '@/components/srivalli/TeacherDashboard';

// Admin dashboard
import {
  AdminLayout,
  AdminDashMain,
  AdminCertificates,
  AdminStudents,
  AdminParents,
  AdminTeachers,
  AdminCourses,
  AdminPayments,
  AdminDemoRequests,
  AdminReports,
  AdminSettings,
  AdminTeacherAssignments,
  
} from '@/components/srivalli/AdminDashboard';

function PublicScreen({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'ABOUT': return <AboutPage />;
    case 'COURSES': return <CoursesPage />;
    case 'CONTACT': return <ContactPage />;
    case 'DEMO': return <DemoPage />;
    case 'LOGIN': return <LoginPage />;
    case 'REGISTER_STUDENT': return <RegisterStudentPage />;
    case 'REGISTER_PARENT': return <RegisterParentPage />;
    default: return <HomePage />;
  }
}

function StudentScreen({ screen }: { screen: Screen }) {
  const content = (() => {
    switch (screen) {
      case 'STUDENT_COURSES': return <StudentCourses />;
      case 'STUDENT_CLASSES': return <StudentClasses />;
      case 'STUDENT_ASSIGNMENTS': return <StudentAssignments />;
      case 'STUDENT_QUIZZES': return <StudentQuizzes />;
      case 'STUDENT_MATERIALS': return <StudentProgress />;
      case 'STUDENT_PROGRESS': return <StudentProgress />;
      case 'STUDENT_LEADERBOARD': return <StudentLeaderboard />;
      case 'STUDENT_CERTIFICATES': return <StudentCertificates />;
      case 'STUDENT_PROFILE': return <StudentProfile />;
      case 'STUDENT_VIDEO_SUBMISSIONS': return <StudentVideoSubmissions />;
      default: return <StudentDashMain />;
    }
  })();
  return <StudentLayout>{content}</StudentLayout>;
}

function ParentScreen({ screen }: { screen: Screen }) {
  const content = (() => {
    switch (screen) {
      case 'PARENT_CHILDREN': return <ParentChildren />;
      case 'PARENT_CLASSES': return <ParentClasses />;
      case 'PARENT_PAYMENTS': return <ParentPayments />;
      case 'PARENT_CERTIFICATES': return <ParentCertificates />;
      case 'PARENT_PROFILE': return <ParentProfile />;
      case 'PARENT_DASHBOARD':
      default: return <ParentDashMain />;
    }
  })();
  return <ParentLayout>{content}</ParentLayout>;
}

function TeacherScreen({ screen }: { screen: Screen }) {
  const content = (() => {
    switch (screen) {
      case 'TEACHER_STUDENTS': return <TeacherStudents />;
      case 'TEACHER_CLASSES': return <TeacherClasses />;
      case 'TEACHER_ASSIGNMENTS': return <TeacherAssignments />;
      case 'TEACHER_QUIZZES': return <TeacherQuizzes />;
      case 'TEACHER_REPORTS': return <TeacherReports />;
      case 'TEACHER_COUNSELLING': return <TeacherCounselling />;
      case 'TEACHER_VIDEO_REVIEWS': return <TeacherVideoReviews />;
      case 'TEACHER_PROFILE': return <TeacherProfile />;
      case 'TEACHER_DASHBOARD':
      default: return <TeacherDashMain />;
    }
  })();
  return <TeacherLayout>{content}</TeacherLayout>;
}

function AdminScreen({ screen }: { screen: Screen }) {
  const content = (() => {
    switch (screen) {
      case 'ADMIN_STUDENTS': return <AdminStudents />;
      case 'ADMIN_PARENTS': return <AdminParents />;
      case 'ADMIN_TEACHERS': return <AdminTeachers />;
      case 'ADMIN_COURSES': return <AdminCourses />;
      case 'ADMIN_PAYMENTS': return <AdminPayments />;
      case 'ADMIN_DEMO_REQUESTS': return <AdminDemoRequests />;
      
      case 'ADMIN_REPORTS': return <AdminReports />;
      case 'ADMIN_SETTINGS': return <AdminSettings />;
      case 'ADMIN_ACTIVITY': return <AdminActivity />;
      case 'ADMIN_CERTIFICATES': return <AdminCertificates />;
      case 'ADMIN_TEACHER_ASSIGNMENTS': return <AdminTeacherAssignments />;
      case 'ADMIN_DASHBOARD':
      default: return <AdminDashMain />;
    }
  })();
  return <AdminLayout>{content}</AdminLayout>;
}

export default function Page() {
  const screen = useAppStore((s) => s.screen);
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    initAuthListener();
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  return (
    <>
      {showLoader && <LoadingScreen onComplete={handleLoaderComplete} />}
      <ToastContainer />
      {user?.role === 'student' && <StudentScreen screen={screen} />}
      {user?.role === 'parent' && <ParentScreen screen={screen} />}
      {user?.role === 'teacher' && <TeacherScreen screen={screen} />}
      {user?.role === 'admin' && <AdminScreen screen={screen} />}
      {!user && <PublicScreen screen={screen} />}
    </>
  );
}