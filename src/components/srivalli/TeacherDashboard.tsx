'use client';

import React, { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, Video, ClipboardList, Brain,
  BarChart3, UserCircle, LogOut, Menu, Home, Bell,
  ChevronRight, Eye, Clock, CheckCircle2, XCircle,
  Plus, Search, Filter, Star, Target, Zap, Loader2,
  X, Calendar, TrendingUp, BookOpen, Award, FileText,
  PenTool, Mic, Play, ExternalLink, Check, Edit3,
  Save, ChevronDown, MessageSquare, AlertCircle, GraduationCap,
  CircleDot, Send, RotateCcw, Sparkles, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAppStore, getAuthHeaders } from '@/lib/store';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const nav = (s: import('@/lib/store').Screen) => useAppStore.getState().navigate(s);
const addToast = (msg: string, type?: 'success' | 'error' | 'info') =>
  useAppStore.getState().addToast(msg, type);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (d: string) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const formatTime = (t: string) => {
  if (!t) return '';
  try {
    const [hh, mm] = t.split(':');
    const hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${mm} ${ampm}`;
  } catch { return t; }
};

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  try {
    return new Date(dateStr).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  } catch { return false; }
};

const isPast = (dateStr: string) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d < new Date();
  } catch { return false; }
};


const fetchWithAuth = async (url: string, init?: RequestInit) => {
  const token = useAppStore.getState().idToken;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    useAppStore.getState().logout();
  }
  return res;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface NavItem {
  label: string;
  icon: ReactNode;
  screen: import('@/lib/store').Screen;
}

interface StudentItem {
  id: string;
  name: string;
  email?: string | null;
  grade?: string | null;
  points: number;
  enrollments?: Array<{
    id: string;
    course?: { id: string; title: string } | null;
    status: string;
  }>;
  createdAt?: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  category?: string | null;
}

interface ClassItem {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string | null;
  status: string;
  meetingLink?: string | null;
  courseId: string;
  teacherId?: string | null;
  course?: { id: string; title: string } | null;
  teacher?: { id: string; name: string } | null;
}

interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string | null;
  marks?: number | null;
  feedback?: string | null;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  student?: { id: string; name: string } | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  dueDate?: string | null;
  maxMarks: number;
  isActive: boolean;
  courseId?: string | null;
  course?: { id: string; title: string } | null;
  submissions?: SubmissionItem[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimit: number;
  questions: string;
  isActive: boolean;
  courseId?: string | null;
  course?: { id: string; title: string } | null;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score?: number | null;
  total?: number | null;
  percentage?: number | null;
  timeTaken?: number | null;
  createdAt: string;
  student?: { id: string; name: string } | null;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  present: boolean;
  date: string;
  class?: { id: string; title: string; course?: { id: string; title: string } | null } | null;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. TEACHER LAYOUT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, screen: 'TEACHER_DASHBOARD' },
  { label: 'Students', icon: <Users className="w-5 h-5" />, screen: 'TEACHER_STUDENTS' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'TEACHER_CLASSES' },
  { label: 'Assignments', icon: <ClipboardList className="w-5 h-5" />, screen: 'TEACHER_ASSIGNMENTS' },
  { label: 'Quizzes', icon: <Brain className="w-5 h-5" />, screen: 'TEACHER_QUIZZES' },
  { label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, screen: 'TEACHER_REPORTS' },
  { label: 'Counselling', icon: <Heart className="w-5 h-5" />, screen: 'TEACHER_COUNSELLING' },
  { label: 'Video Submissions', icon: <Video className="w-5 h-5" />, screen: 'TEACHER_VIDEO_REVIEWS' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'TEACHER_PROFILE' },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Home', icon: <Home className="w-5 h-5" />, screen: 'TEACHER_DASHBOARD' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'TEACHER_CLASSES' },
  { label: 'Tasks', icon: <ClipboardList className="w-5 h-5" />, screen: 'TEACHER_ASSIGNMENTS' },
  { label: 'Quizzes', icon: <Brain className="w-5 h-5" />, screen: 'TEACHER_QUIZZES' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'TEACHER_PROFILE' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const logout = useAppStore(s => s.logout);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-5 border-b border-srivalli-light-pink">
        <button onClick={() => { nav('HOME'); onClose?.(); }} className="flex items-center gap-2">
          <img src="/logo.svg" alt="Srivalli SmartSpeak" className="h-8 w-auto" />
          <span className="text-lg font-bold text-gradient">Srivalli SmartSpeak</span>
        </button>
      </div>

      <div className="px-4 py-4 border-b border-srivalli-light-pink/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-srivalli-purple/30">
            <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple font-bold text-sm">
              {user?.name ? getInitials(user.name) : 'T'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{user?.name || 'Teacher'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {SIDEBAR_NAV.map(item => {
            const active = screen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => { nav(item.screen); onClose?.(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-srivalli-light-purple text-srivalli-purple shadow-sm'
                    : 'text-gray-600 hover:bg-srivalli-light-purple/50 hover:text-srivalli-purple'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="px-3 py-3 border-t border-srivalli-light-pink">
        <button
          onClick={() => { logout(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function TeacherLayout({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      TEACHER_DASHBOARD: 'Dashboard',
      TEACHER_STUDENTS: 'Students',
      TEACHER_CLASSES: 'Classes',
      TEACHER_ASSIGNMENTS: 'Assignments',
      TEACHER_QUIZZES: 'Quizzes',
      TEACHER_REPORTS: 'Reports',
      TEACHER_COUNSELLING: 'Counselling',
    };
    return titles[screen] || 'Dashboard';
  }, [screen]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-srivalli-light-purple/30 z-40">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-srivalli-light-purple/20">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-srivalli-light-purple/30">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-srivalli-light-purple/30 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-srivalli-pink rounded-full" />
              </button>
              <Avatar className="h-8 w-8 ring-2 ring-srivalli-purple/20">
                <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple font-bold text-xs">
                  {user?.name ? getInitials(user.name) : 'T'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Bottom Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-srivalli-light-purple/20 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {BOTTOM_NAV.map(item => {
            const active = screen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => nav(item.screen)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active
                    ? 'text-srivalli-purple'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   2. TEACHER DASHBOARD MAIN
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherDashMain() {
  const user = useAppStore(s => s.user);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, aRes, coRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth('/api/classes'),
        fetchWithAuth('/api/assignments'),
        fetchWithAuth('/api/courses'),
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      const aData = await aRes.json();
      const coData = await coRes.json();
      if (sData.success) setStudents(sData.students);
      if (cData.success) setClasses(cData.classes);
      if (aData.success) setAssignments(aData.assignments);
      if (coData.success) setCourses(coData.courses);
    } catch {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const todayClasses = useMemo(() =>
    classes.filter(c => isToday(c.date)),
    [classes],
  );

  const pendingReviews = useMemo(() => {
    let count = 0;
    assignments.forEach(a => {
      if (a.submissions) {
        count += a.submissions.filter(s => s.status === 'submitted').length;
      }
    });
    return count;
  }, [assignments]);

  const recentSubmissions = useMemo(() => {
    const all: (SubmissionItem & { assignmentTitle?: string; studentName?: string })[] = [];
    assignments.forEach(a => {
      if (a.submissions) {
        a.submissions.forEach(s => {
          if (s.status === 'submitted') {
            all.push({ ...s, assignmentTitle: a.title });
          }
        });
      }
    });
    return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
  }, [assignments]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="gradient-pink rounded-2xl p-6 text-white fun-shadow">
        <h2 className="text-2xl md:text-3xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0] || 'Teacher'}! 👩‍🏫</h2>
        <p className="text-white mt-1">Here&apos;s your teaching overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-srivalli-light-pink flex items-center justify-center">
                <Users className="w-5 h-5 text-srivalli-pink" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-srivalli-light-purple flex items-center justify-center">
                <Video className="w-5 h-5 text-srivalli-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayClasses.length}</p>
                <p className="text-xs text-muted-foreground">Today&apos;s Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-srivalli-light-orange flex items-center justify-center">
                <Clock className="w-5 h-5 text-srivalli-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingReviews}</p>
                <p className="text-xs text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-srivalli-light-teal flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-srivalli-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                <p className="text-xs text-muted-foreground">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-srivalli-purple" />
                Today&apos;s Classes
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-srivalli-purple" onClick={() => nav('TEACHER_CLASSES')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {todayClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No classes scheduled for today 🎉</p>
            ) : (
              <div className="space-y-3">
                {todayClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-srivalli-light-purple/20 hover:bg-srivalli-light-purple/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-srivalli-purple/10 flex items-center justify-center">
                      <Video className="w-4 h-4 text-srivalli-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{cls.course?.title || cls.title}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(cls.time)} {cls.duration ? `• ${cls.duration}` : ''}</p>
                    </div>
                    <Badge variant={cls.status === 'scheduled' ? 'default' : 'secondary'}
                      className={cls.status === 'scheduled' ? 'bg-srivalli-teal text-white text-[10px]' : 'text-[10px]'}>
                      {cls.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-srivalli-orange" />
                Pending Reviews
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-srivalli-orange" onClick={() => nav('TEACHER_ASSIGNMENTS')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All caught up! 🌟</p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-srivalli-light-orange/20 hover:bg-srivalli-light-orange/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-srivalli-orange/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-srivalli-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{sub.assignmentTitle || 'Assignment'}</p>
                      <p className="text-xs text-muted-foreground">Submitted {formatDate(sub.submittedAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-0 fun-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-srivalli-teal" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => nav('TEACHER_ASSIGNMENTS')}
              className="h-auto py-4 flex-col gap-2 rounded-xl bg-srivalli-light-pink hover:bg-srivalli-light-pink/80 text-srivalli-pink border-0"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">Create Assignment</span>
            </Button>
            <Button
              onClick={() => nav('TEACHER_QUIZZES')}
              className="h-auto py-4 flex-col gap-2 rounded-xl bg-srivalli-light-purple hover:bg-srivalli-light-purple/80 text-srivalli-purple border-0"
            >
              <Brain className="w-5 h-5" />
              <span className="text-xs font-semibold">Create Quiz</span>
            </Button>
            <Button
              onClick={() => nav('TEACHER_CLASSES')}
              className="h-auto py-4 flex-col gap-2 rounded-xl bg-srivalli-light-teal hover:bg-srivalli-light-teal/80 text-srivalli-teal border-0"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-semibold">Mark Attendance</span>
            </Button>
            <Button
              onClick={() => nav('TEACHER_REPORTS')}
              className="h-auto py-4 flex-col gap-2 rounded-xl bg-srivalli-light-orange hover:bg-srivalli-light-orange/80 text-srivalli-orange border-0"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-semibold">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   3. TEACHER STUDENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherStudents() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([fetchWithAuth('/api/students'), fetchWithAuth('/api/courses')]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      if (sData.success) setStudents(sData.students);
      if (cData.success) setCourses(cData.courses);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetchWithAuth(`/api/students?id=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setExpandedData(prev => ({ ...prev, [studentId]: data }));
      }
    } catch {
      addToast('Failed to load student details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!expandedData[id]) {
      fetchStudentDetail(id);
    }
  };

  const filtered = useMemo(() => {
    let result = students;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (courseFilter !== 'all') {
      result = result.filter(s =>
        s.enrollments?.some(e => e.courseId === courseFilter && e.status === 'active')
      );
    }
    return result;
  }, [students, search, courseFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-srivalli-light-purple/30"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl border-srivalli-light-purple/30">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No students found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(student => {
            const isExpanded = expandedId === student.id;
            const detail = expandedData[student.id];
            const courseNames = student.enrollments
              ?.filter(e => e.status === 'active')
              .map(e => e.course?.title)
              .filter(Boolean);

            return (
              <Card key={student.id} className="rounded-2xl border-0 fun-shadow overflow-hidden">
                <button
                  onClick={() => handleExpand(student.id)}
                  className="w-full text-left p-4 hover:bg-srivalli-light-purple/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-srivalli-purple/20">
                      <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple font-bold text-sm">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{student.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.grade && (
                          <Badge variant="secondary" className="text-[10px] bg-srivalli-light-purple/50 text-srivalli-purple">
                            Grade {student.grade}
                          </Badge>
                        )}
                        {courseNames?.slice(0, 2).map(name => (
                          <Badge key={name} variant="outline" className="text-[10px]">{name}</Badge>
                        ))}
                        {courseNames && courseNames.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{courseNames.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-srivalli-teal">{student.points} pts</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-srivalli-light-purple/20 p-4 bg-srivalli-light-purple/5">
                    {loadingDetail && !detail ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : detail ? (
                      <div className="space-y-4">
                        {/* Student Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-white">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium truncate">{detail.student?.email || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white">
                            <p className="text-xs text-muted-foreground">School</p>
                            <p className="text-sm font-medium truncate">{detail.student?.schoolName || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white">
                            <p className="text-xs text-muted-foreground">Joined</p>
                            <p className="text-sm font-medium">{formatDate(detail.student?.createdAt)}</p>
                          </div>
                        </div>

                        {/* Attendance */}
                        <div className="p-3 rounded-xl bg-white">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Attendance</p>
                          <div className="flex items-center gap-3">
                            <Progress
                              value={detail.attendanceStats?.percentage || 0}
                              className="flex-1 h-2"
                            />
                            <span className="text-sm font-bold text-srivalli-teal">
                              {detail.attendanceStats?.percentage || 0}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {detail.attendanceStats?.present || 0} present / {detail.attendanceStats?.total || 0} total
                          </p>
                        </div>

                        {/* Enrolled Courses */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Enrolled Courses</p>
                          <div className="flex flex-wrap gap-2">
                            {detail.student?.enrollments?.map(e => (
                              <Badge key={e.id} variant="secondary" className="rounded-lg">
                                {e.course?.title || 'Unknown'}
                              </Badge>
                            ))}
                            {(!detail.student?.enrollments || detail.student.enrollments.length === 0) && (
                              <p className="text-xs text-muted-foreground">No enrollments</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   4. TEACHER CLASSES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherClasses() {
  const user = useAppStore(s => s.user);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Create form
  const [newClass, setNewClass] = useState({
    courseId: '', title: '', date: '', time: '', duration: '', meetingLink: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, coRes, sRes] = await Promise.all([
        fetchWithAuth('/api/classes'),
        fetchWithAuth('/api/courses'),
        fetchWithAuth('/api/students'),
      ]);
      const cData = await cRes.json();
      const coData = await coRes.json();
      const sData = await sRes.json();
      if (cData.success) setClasses(cData.classes);
      if (coData.success) setCourses(coData.courses);
      if (sData.success) setStudents(sData.students);
    } catch {
      addToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateClass = async () => {
    if (!newClass.courseId || !newClass.title || !newClass.date || !newClass.time) {
      addToast('Please fill required fields', 'error');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClass,
          teacherId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Class created successfully!');
        setCreateOpen(false);
        setNewClass({ courseId: '', title: '', date: '', time: '', duration: '', meetingLink: '' });
        fetchData();
      } else {
        addToast(data.message || 'Failed to create class', 'error');
      }
    } catch {
      addToast('Failed to create class', 'error');
    }
  };

  const handleStatusUpdate = async (classId: string, status: string) => {
    if (status === 'completed' && !window.confirm('Are you sure you want to mark this class as completed?')) return;
    try {
      const res = await fetchWithAuth('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classId, status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Class marked as ${status}`);
        fetchData();
      } else {
        addToast(data.message || 'Failed to update class', 'error');
      }
    } catch {
      addToast('Failed to update class', 'error');
    }
  };

  const openAttendance = (cls: ClassItem) => {
    setSelectedClass(cls);
    const enrolledStudents = students.filter(s =>
      s.enrollments?.some(e => e.courseId === cls.courseId && e.status === 'active')
    );
    const map: Record<string, boolean> = {};
    enrolledStudents.forEach(s => { map[s.id] = true; });
    setAttendanceMap(map);
    setAttendanceOpen(true);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const submitAttendance = async () => {
    if (!selectedClass) return;
    setSubmittingAttendance(true);
    try {
      const presentIds = Object.entries(attendanceMap)
        .filter(([_, present]) => present)
        .map(([id]) => id);
      const absentIds = Object.entries(attendanceMap)
        .filter(([_, present]) => !present)
        .map(([id]) => id);

      const promises: Promise<Response>[] = [];
      if (presentIds.length > 0) {
        promises.push(fetchWithAuth('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId: selectedClass.id, studentIds: presentIds, present: true }),
        }));
      }
      if (absentIds.length > 0) {
        promises.push(fetchWithAuth('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId: selectedClass.id, studentIds: absentIds, present: false }),
        }));
      }

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);
      if (allOk) {
        addToast('Attendance saved successfully!');
        setAttendanceOpen(false);
      } else {
        addToast('Some attendance records failed', 'error');
      }
    } catch {
      addToast('Failed to save attendance', 'error');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const enrolledStudentsForClass = (cls: ClassItem) =>
    students.filter(s =>
      s.enrollments?.some(e => e.courseId === cls.courseId && e.status === 'active')
    );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold">All Classes ({classes.length})</h2>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gradient-pink text-white rounded-xl gap-2 border-0"
        >
          <Plus className="w-4 h-4" /> Create Class
        </Button>
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        {classes.length === 0 ? (
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardContent className="p-8 text-center">
              <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No classes scheduled yet</p>
            </CardContent>
          </Card>
        ) : (
          classes.map(cls => {
            const studentCount = enrolledStudentsForClass(cls).length;
            const statusColor = cls.status === 'completed'
              ? 'bg-srivalli-green/10 text-srivalli-green'
              : cls.status === 'cancelled'
              ? 'bg-red-100 text-red-600'
              : 'bg-srivalli-teal/10 text-srivalli-teal';

            return (
              <Card key={cls.id} className="rounded-2xl border-0 fun-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-srivalli-light-purple flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-srivalli-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {cls.course?.title || cls.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(cls.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(cls.time)}
                          </span>
                          {cls.duration && <span>{cls.duration}</span>}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {studentCount} students
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${statusColor}`} variant="secondary">
                        {cls.status}
                      </Badge>
                      {cls.meetingLink && (
                        <Button size="sm" variant="outline" className="rounded-lg text-[10px] h-7 gap-1" asChild>
                          <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" /> Join
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline" className="rounded-lg text-[10px] h-7"
                        onClick={() => openAttendance(cls)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Attendance
                      </Button>
                      {cls.status === 'scheduled' && !isPast(cls.date) && (
                        <Button
                          size="sm" variant="outline" className="rounded-lg text-[10px] h-7"
                          onClick={() => handleStatusUpdate(cls.id, 'live')}
                        >
                          <Play className="w-3 h-3 mr-1" /> Go Live
                        </Button>
                      )}
                      {cls.status === 'scheduled' && isPast(cls.date) && (
                        <Button
                          size="sm" variant="outline" className="rounded-lg text-[10px] h-7"
                          onClick={() => handleStatusUpdate(cls.id, 'completed')}
                        >
                          <Check className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Schedule a new class session for your students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select value={newClass.courseId} onValueChange={v => setNewClass(p => ({ ...p, courseId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newClass.title}
                onChange={e => setNewClass(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Introduction to Letters"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newClass.date}
                  onChange={e => setNewClass(p => ({ ...p, date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={newClass.time}
                  onChange={e => setNewClass(p => ({ ...p, time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                value={newClass.duration}
                onChange={e => setNewClass(p => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 45 min"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <Input
                value={newClass.meetingLink}
                onChange={e => setNewClass(p => ({ ...p, meetingLink: e.target.value }))}
                placeholder="https://zoom.us/..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateClass} className="gradient-pink text-white rounded-xl border-0">
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              {selectedClass?.course?.title || selectedClass?.title} — {formatDate(selectedClass?.date || '')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 -mx-1">
            <div className="space-y-2 px-1">
              {Object.keys(attendanceMap).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No enrolled students for this class</p>
              ) : (
                Object.entries(attendanceMap).map(([studentId, present]) => {
                  const student = students.find(s => s.id === studentId);
                  if (!student) return null;
                  return (
                    <div key={studentId} className="flex items-center justify-between p-3 rounded-xl hover:bg-srivalli-light-purple/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple text-xs font-bold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAttendance(studentId)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            present
                              ? 'bg-srivalli-green/20 text-srivalli-green'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {present ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={submitAttendance}
              disabled={submittingAttendance}
              className="gradient-teal text-white rounded-xl border-0"
            >
              {submittingAttendance && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   5. TEACHER ASSIGNMENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherAssignments() {
  const user = useAppStore(s => s.user);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalData, setEvalData] = useState<Record<string, { marks: string; feedback: string }>>({});

  // Create form
  const [newAssignment, setNewAssignment] = useState({
    courseId: '', title: '', description: '', type: 'writing', dueDate: '', maxMarks: '100',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([fetchWithAuth('/api/assignments'), fetchWithAuth('/api/courses')]);
      const aData = await aRes.json();
      const cData = await cRes.json();
      if (aData.success) setAssignments(aData.assignments);
      if (cData.success) setCourses(cData.courses);
    } catch {
      addToast('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newAssignment.title || !newAssignment.type) {
      addToast('Title and type are required', 'error');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAssignment,
          maxMarks: parseInt(newAssignment.maxMarks) || 100,
          teacherId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Assignment created successfully!');
        setCreateOpen(false);
        setNewAssignment({ courseId: '', title: '', description: '', type: 'writing', dueDate: '', maxMarks: '100' });
        fetchData();
      } else {
        addToast(data.message || 'Failed to create assignment', 'error');
      }
    } catch {
      addToast('Failed to create assignment', 'error');
    }
  };

  const openSubmissions = (a: AssignmentItem) => {
    setSelectedAssignment(a);
    const map: Record<string, { marks: string; feedback: string }> = {};
    if (a.submissions) {
      a.submissions.forEach(s => {
        map[s.id] = {
          marks: s.marks?.toString() || '',
          feedback: s.feedback || '',
        };
      });
    }
    setEvalData(map);
    setSubmissionsOpen(true);
  };

  const handleEvaluate = async (submissionId: string) => {
    const data = evalData[submissionId];
    if (!data) return;

    setEvaluating(true);
    try {
      const res = await fetchWithAuth('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          marks: data.marks ? parseInt(data.marks) : null,
          feedback: data.feedback || null,
          status: 'graded',
        }),
      });
      const result = await res.json();
      if (result.success) {
        addToast('Submission graded!');
        fetchData();
      } else {
        addToast(result.message || 'Failed to grade', 'error');
      }
    } catch {
      addToast('Failed to grade submission', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold">Assignments ({assignments.length})</h2>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gradient-warm text-white rounded-xl gap-2 border-0"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </Button>
      </div>

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardContent className="p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No assignments yet</p>
            </CardContent>
          </Card>
        ) : (
          assignments.map(a => {
            const submissionsCount = a.submissions?.length || 0;
            const pendingCount = a.submissions?.filter(s => s.status === 'submitted').length || 0;
            const gradedCount = a.submissions?.filter(s => s.status === 'graded').length || 0;

            return (
              <Card key={a.id} className="rounded-2xl border-0 fun-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        a.type === 'speaking' ? 'bg-srivalli-light-orange' : 'bg-srivalli-light-pink'
                      }`}>
                        {a.type === 'speaking'
                          ? <Mic className="w-5 h-5 text-srivalli-orange" />
                          : <PenTool className="w-5 h-5 text-srivalli-pink" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{a.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
                          {a.course && <span>{a.course.title}</span>}
                          {a.dueDate && (
                            <span className={isPast(a.dueDate) ? 'text-red-500' : ''}>
                              Due {formatDate(a.dueDate)}
                            </span>
                          )}
                          <span>{a.maxMarks} marks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <p className="text-xs text-muted-foreground">Submissions</p>
                        <p className="text-sm font-semibold">{gradedCount}/{submissionsCount}</p>
                      </div>
                      {pendingCount > 0 && (
                        <Badge className="bg-srivalli-orange/10 text-srivalli-orange text-[10px]" variant="secondary">
                          {pendingCount} pending
                        </Badge>
                      )}
                      <Button
                        size="sm" variant="outline" className="rounded-lg text-[10px] h-7"
                        onClick={() => openSubmissions(a)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View ({submissionsCount})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>Assign work to your students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={newAssignment.courseId} onValueChange={v => setNewAssignment(p => ({ ...p, courseId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newAssignment.title}
                onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Write a poem about nature"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newAssignment.description}
                onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                placeholder="Instructions for students..."
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={newAssignment.type} onValueChange={v => setNewAssignment(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing">
                      <span className="flex items-center gap-2"><PenTool className="w-3 h-3" /> Writing</span>
                    </SelectItem>
                    <SelectItem value="speaking">
                      <span className="flex items-center gap-2"><Mic className="w-3 h-3" /> Speaking</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input
                  type="number"
                  value={newAssignment.maxMarks}
                  onChange={e => setNewAssignment(p => ({ ...p, maxMarks: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newAssignment.dueDate}
                onChange={e => setNewAssignment(p => ({ ...p, dueDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} className="gradient-warm text-white rounded-xl border-0">
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions & Evaluation Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Submissions — {selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.submissions?.length || 0} submissions • Max marks: {selectedAssignment?.maxMarks}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] -mx-1">
            <div className="space-y-3 px-1">
              {selectedAssignment?.submissions && selectedAssignment.submissions.length > 0 ? (
                selectedAssignment.submissions.map(sub => {
                  const ev = evalData[sub.id] || { marks: '', feedback: '' };
                  const isGraded = sub.status === 'graded';
                  return (
                    <Card key={sub.id} className={`rounded-xl border-0 ${isGraded ? 'bg-srivalli-light-green/30' : 'bg-srivalli-light-orange/20'}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple text-[10px] font-bold">
                                  {getInitials(sub.student?.name || 'S')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold">{sub.student?.name || 'Unknown Student'}</span>
                            </div>
                            <Badge variant={isGraded ? 'secondary' : 'default'}
                              className={`text-[10px] ${isGraded ? 'bg-srivalli-green/20 text-srivalli-green' : 'bg-srivalli-orange text-white'}`}>
                              {isGraded ? 'Graded' : 'Pending'}
                            </Badge>
                          </div>

                          {(sub.content || sub.fileUrl) && (
                            <div className="text-xs text-muted-foreground bg-white/60 rounded-lg p-2 space-y-2">
                              {sub.content && <p className="line-clamp-3">{sub.content}</p>}
                              {sub.fileUrl && (
                                <a href={String(sub.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-srivalli-pink flex items-center gap-1 hover:underline">
                                  <ExternalLink className="w-3 h-3" /> View Submitted File/Link
                                </a>
                              )}
                            </div>
                          )}

                          <p className="text-[10px] text-muted-foreground">
                            Submitted {formatDate(sub.submittedAt)}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-[10px]">Marks (out of {selectedAssignment.maxMarks})</Label>
                              <Input
                                type="number"
                                value={ev.marks}
                                onChange={e => setEvalData(prev => ({
                                  ...prev, [sub.id]: { ...ev, marks: e.target.value },
                                }))}
                                className="h-8 rounded-lg text-sm mt-1"
                                disabled={isGraded}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-[10px]">Feedback</Label>
                              <Input
                                value={ev.feedback}
                                onChange={e => setEvalData(prev => ({
                                  ...prev, [sub.id]: { ...ev, feedback: e.target.value },
                                }))}
                                placeholder="Great work!"
                                className="h-8 rounded-lg text-sm mt-1"
                                disabled={isGraded}
                              />
                            </div>
                          </div>

                          {!isGraded && (
                            <Button
                              size="sm"
                              onClick={() => handleEvaluate(sub.id)}
                              disabled={evaluating}
                              className="gradient-teal text-white rounded-lg text-xs h-7 border-0"
                            >
                              {evaluating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              <Send className="w-3 h-3 mr-1" /> Submit Grade
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No submissions yet</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6. TEACHER QUIZZES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherQuizzes() {
  const user = useAppStore(s => s.user);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Create form
  const [newQuiz, setNewQuiz] = useState({
    courseId: '', title: '', description: '', timeLimit: '600',
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, cRes, sRes] = await Promise.all([
        fetchWithAuth('/api/quizzes'),
        fetchWithAuth('/api/courses'),
        fetchWithAuth('/api/students'),
      ]);
      const qData = await qRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      if (qData.success) setQuizzes(qData.quizzes);
      if (cData.success) setCourses(cData.courses);
      if (sData.success) setStudents(sData.students);
    } catch {
      addToast('Failed to load quizzes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const newOpts = [...q.options];
      newOpts[oIndex] = value;
      return { ...q, options: newOpts };
    }));
  };

  const setCorrectAnswer = (qIndex: number, oIndex: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, correctAnswer: oIndex } : q));
  };

  const resetCreateForm = () => {
    setNewQuiz({ courseId: '', title: '', description: '', timeLimit: '600' });
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const handleCreate = async () => {
    if (!newQuiz.title) {
      addToast('Title is required', 'error');
      return;
    }
    const validQuestions = questions.filter(q => q.question.trim() !== '');
    if (validQuestions.length === 0) {
      addToast('Add at least one question', 'error');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuiz,
          timeLimit: parseInt(newQuiz.timeLimit) || 600,
          questions: validQuestions,
          teacherId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Quiz created successfully!');
        setCreateOpen(false);
        resetCreateForm();
        fetchData();
      } else {
        addToast(data.message || 'Failed to create quiz', 'error');
      }
    } catch {
      addToast('Failed to create quiz', 'error');
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  const openAttempts = async (quiz: QuizItem) => {
    setSelectedQuiz(quiz);
    setAttemptsOpen(true);
    setLoadingAttempts(true);
    try {
      setQuizAttempts(quiz.attempts || []);
    } catch {
      addToast('Failed to load attempts', 'error');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const parseQuestions = (questionsStr: string): QuizQuestion[] => {
    try {
      return JSON.parse(questionsStr);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold">Quizzes ({quizzes.length})</h2>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gradient-pink text-white rounded-xl gap-2 border-0"
        >
          <Plus className="w-4 h-4" /> Create Quiz
        </Button>
      </div>

      <div className="space-y-3">
        {quizzes.length === 0 ? (
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No quizzes created yet</p>
            </CardContent>
          </Card>
        ) : (
          quizzes.map(quiz => {
            const parsed = parseQuestions(quiz.questions);
            const qCount = parsed.length;

            return (
              <Card key={quiz.id} className="rounded-2xl border-0 fun-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-srivalli-light-pink flex items-center justify-center shrink-0">
                        <Brain className="w-5 h-5 text-srivalli-pink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{quiz.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {quiz.course && <span>{quiz.course.title}</span>}
                          <span className="flex items-center gap-1">
                            <CircleDot className="w-3 h-3" /> {qCount} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {Math.floor((quiz.timeLimit || 600) / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline" className="rounded-lg text-[10px] h-7"
                      onClick={() => openAttempts(quiz)}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View Attempts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Quiz Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) resetCreateForm();
      }}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>Add questions with multiple choice options.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] -mx-1">
            <div className="space-y-4 px-1 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={newQuiz.courseId} onValueChange={v => setNewQuiz(p => ({ ...p, courseId: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={newQuiz.timeLimit}
                    onChange={e => setNewQuiz(p => ({ ...p, timeLimit: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newQuiz.title}
                  onChange={e => setNewQuiz(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Alphabet Quiz"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newQuiz.description}
                  onChange={e => setNewQuiz(p => ({ ...p, description: e.target.value }))}
                  placeholder="Quiz description..."
                  className="rounded-xl min-h-[60px]"
                />
              </div>

              <Separator />

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Questions ({questions.filter(q => q.question.trim()).length})</Label>
                  <Button size="sm" variant="outline" className="rounded-lg gap-1" onClick={addQuestion}>
                    <Plus className="w-3 h-3" /> Add Question
                  </Button>
                </div>

                {questions.map((q, qIndex) => (
                  <Card key={qIndex} className="rounded-xl border border-srivalli-light-purple/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-srivalli-purple mt-1">Q{qIndex + 1}</span>
                        {questions.length > 1 && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={q.question}
                        onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter question..."
                        className="rounded-lg"
                      />
                      <div className="space-y-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <button
                              onClick={() => setCorrectAnswer(qIndex, oIndex)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                q.correctAnswer === oIndex
                                  ? 'border-srivalli-green bg-srivalli-green text-white'
                                  : 'border-gray-500 hover:border-srivalli-purple'
                              }`}
                            >
                              {q.correctAnswer === oIndex && <Check className="w-3 h-3" />}
                            </button>
                            <span className="text-xs font-medium text-muted-foreground w-5">{String.fromCharCode(65 + oIndex)}</span>
                            <Input
                              value={opt}
                              onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              className="h-8 rounded-lg text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="gradient-pink text-white rounded-xl border-0">
              Create Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Attempts Dialog */}
      <Dialog open={attemptsOpen} onOpenChange={setAttemptsOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Attempts — {selectedQuiz?.title}</DialogTitle>
            <DialogDescription>Student attempts and scores.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingAttempts ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : quizAttempts.length > 0 ? (
              <div className="space-y-2">
                {quizAttempts.map(attempt => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-srivalli-light-pink/20">
                    <div>
                      <p className="text-sm font-semibold">{attempt.studentName || getStudentName(attempt.studentId)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(attempt.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-srivalli-teal">
                        {attempt.score}/{attempt.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.percentage?.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No attempts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Students will see this quiz in their dashboard</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   7. TEACHER REPORTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherReports() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { stats: { total: number; present: number; percentage: number } }>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes, qRes, cRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth('/api/assignments'),
        fetchWithAuth('/api/quizzes'),
        fetchWithAuth('/api/classes'),
      ]);
      const sData = await sRes.json();
      const aData = await aRes.json();
      const qData = await qRes.json();
      const cData = await cRes.json();
      if (sData.success) setStudents(sData.students);
      if (aData.success) setAssignments(aData.assignments);
      if (qData.success) setQuizzes(qData.quizzes);
      if (cData.success) setClasses(cData.classes);

      // Fetch attendance for each student
      if (sData.success) {
        const attMap: typeof attendanceData = {};
        const attPromises = sData.students.slice(0, 20).map(async (s: StudentItem) => {
          try {
            const res = await fetchWithAuth(`/api/attendance?studentId=${s.id}`);
            const data = await res.json();
            if (data.success && data.stats) {
              attMap[s.id] = { stats: data.stats };
            }
          } catch { /* skip */ }
        });
        await Promise.all(attPromises);
        setAttendanceData(attMap);
      }
    } catch {
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSubmissions = useMemo(() => {
    let count = 0;
    assignments.forEach(a => { count += a.submissions?.length || 0; });
    return count;
  }, [assignments]);

  const gradedSubmissions = useMemo(() => {
    let count = 0;
    assignments.forEach(a => { count += a.submissions?.filter(s => s.status === 'graded').length || 0; });
    return count;
  }, [assignments]);

  const avgScore = useMemo(() => {
    let total = 0;
    let count = 0;
    assignments.forEach(a => {
      a.submissions?.forEach(s => {
        if (s.status === 'graded' && s.marks != null) {
          total += (s.marks / a.maxMarks) * 100;
          count++;
        }
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  }, [assignments]);

  const avgAttendance = useMemo(() => {
    const vals = Object.values(attendanceData);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((acc, v) => acc + v.stats.percentage, 0);
    return Math.round(sum / vals.length);
  }, [attendanceData]);

  const completedClasses = useMemo(() =>
    classes.filter(c => c.status === 'completed').length,
    [classes],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Performance Reports</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-pink mx-auto flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-srivalli-pink" />
            </div>
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-teal mx-auto flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-srivalli-teal" />
            </div>
            <p className="text-2xl font-bold text-srivalli-teal">{avgAttendance}%</p>
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-purple mx-auto flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-srivalli-purple" />
            </div>
            <p className="text-2xl font-bold text-srivalli-purple">{avgScore}%</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-orange mx-auto flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-srivalli-orange" />
            </div>
            <p className="text-2xl font-bold text-srivalli-orange">{completedClasses}/{classes.length}</p>
            <p className="text-xs text-muted-foreground">Classes Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Performance Summary */}
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-srivalli-purple" />
              Student Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {students.slice(0, 15).map(student => {
                  const att = attendanceData[student.id]?.stats;
                  return (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-srivalli-light-purple/10 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple text-xs font-bold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Progress value={att?.percentage || 0} className="flex-1 h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {att?.percentage || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-srivalli-teal">{student.points} pts</p>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No students</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Assignment Completion & Quiz Performance */}
        <div className="space-y-6">
          {/* Assignment Completion */}
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-srivalli-orange" />
                Assignment Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Graded</span>
                  <span className="text-sm font-bold">{gradedSubmissions}/{totalSubmissions}</span>
                </div>
                <Progress
                  value={totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0}
                  className="h-3"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-bold text-srivalli-orange">{totalSubmissions - gradedSubmissions}</span>
                </div>

                {assignments.length > 0 && (
                  <div className="space-y-2 mt-4 pt-3 border-t border-srivalli-light-pink/30">
                    <p className="text-xs font-semibold text-muted-foreground">Per Assignment</p>
                    {assignments.slice(0, 5).map(a => {
                      const total = a.submissions?.length || 0;
                      const graded = a.submissions?.filter(s => s.status === 'graded').length || 0;
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-28 truncate">{a.title}</span>
                          <Progress value={total > 0 ? (graded / total) * 100 : 0} className="flex-1 h-2" />
                          <span className="text-[10px] font-medium w-10 text-right">{graded}/{total}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Performance */}
          <Card className="rounded-2xl border-0 fun-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-srivalli-pink" />
                Quiz Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Quizzes</span>
                  <span className="text-sm font-bold">{quizzes.length}</span>
                </div>
                <div className="space-y-2 mt-3">
                  {quizzes.slice(0, 5).map(quiz => {
                    const parsed: QuizQuestion[] = (() => { try { return JSON.parse(quiz.questions); } catch { return []; } })();
                    return (
                      <div key={quiz.id} className="p-3 rounded-xl bg-srivalli-light-pink/20">
                        <p className="text-sm font-medium truncate">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {parsed.length} questions • {Math.floor((quiz.timeLimit || 600) / 60)} min
                        </p>
                      </div>
                    );
                  })}
                  {quizzes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No quizzes yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   8. TEACHER PROFILE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function TeacherProfile() {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState((user as any)?.subject || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save — in production this would call an API
    setTimeout(() => {
      addToast('Profile updated successfully!');
      setEditMode(false);
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <Card className="rounded-2xl border-0 fun-shadow overflow-hidden">
        <div className="gradient-pink h-24 relative">
          <div className="absolute -bottom-10 left-6">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              <AvatarFallback className="bg-white text-srivalli-purple font-bold text-xl">
                {user?.name ? getInitials(user.name) : 'T'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-14 p-6">
          {editMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject / Specialization</Label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. English, Mathematics"
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-pink text-white rounded-xl border-0 flex-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{user?.name || 'Teacher'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-srivalli-light-purple/20">
                  <div className="w-8 h-8 rounded-lg bg-srivalli-light-purple flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-srivalli-purple" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="text-sm font-semibold">{(user as any)?.subject || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-srivalli-light-pink/20">
                  <div className="w-8 h-8 rounded-lg bg-srivalli-light-pink flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-srivalli-pink" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-semibold">Teacher</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-srivalli-light-teal/20">
                  <div className="w-8 h-8 rounded-lg bg-srivalli-light-teal flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-srivalli-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-semibold">Srivalli SmartSpeak</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                className="w-full rounded-xl gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        onClick={logout}
        variant="outline"
        className="w-full rounded-xl gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
      >
        <LogOut className="w-4 h-4" /> Logout
      </Button>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   8. TEACHER COUNSELLING
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface CounsellingRecord {
  id: string;
  teacherId: string;
  studentId: string;
  date: string;
  type: 'academic' | 'behavioral' | 'progress' | 'general';
  notes: string;
  followUpDate?: string | null;
  followUpRequired: boolean;
  createdAt?: string;
  studentName?: string;
}

interface StudentOption {
  id: string;
  name: string;
  grade?: string;
}

export function TeacherCounselling() {
  const user = useAppStore(s => s.user);
  const [records, setRecords] = useState<CounsellingRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentsError, setStudentsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'academic' as CounsellingRecord['type'],
    notes: '',
    followUpDate: '',
    followUpRequired: false,
  });

  const fetchRecords = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetchWithAuth(`/api/counselling?teacherId=${user?.id || ''}`),
        fetchWithAuth('/api/students'),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      if (rData.success) setRecords(rData.records);
      if (sData.success) {
        setStudents(sData.students.map((s: any) => ({ id: s.id, name: s.name, grade: s.grade })));
        setStudentsError(false);
      } else {
        setStudentsError(true);
      }
    } catch {
      addToast('Failed to load counselling data', 'error');
      setStudentsError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleCreate = async () => {
    if (!form.studentId || !form.date || !form.type) {
      addToast('Student, date, and type are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithAuth('/api/counselling', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          teacherId: user?.id,
          followUpDate: form.followUpRequired ? form.followUpDate : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Counselling record created successfully!');
        setCreateOpen(false);
        setForm({
          studentId: '',
          date: new Date().toISOString().split('T')[0],
          type: 'academic',
          notes: '',
          followUpDate: '',
          followUpRequired: false,
        });
        fetchRecords();
      } else {
        addToast(data.message || 'Failed to create record', 'error');
      }
    } catch {
      addToast('Failed to create counselling record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-srivalli-light-purple text-srivalli-purple';
      case 'behavioral': return 'bg-srivalli-light-orange text-srivalli-orange';
      case 'progress': return 'bg-srivalli-light-teal text-srivalli-teal';
      case 'general': return 'bg-srivalli-light-pink text-srivalli-pink';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const totalRecords = records.length;
  const followUpPending = records.filter(r => r.followUpRequired).length;
  const thisMonthRecords = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const academicRecords = records.filter(r => r.type === 'academic').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Student Counselling</h2>
          <p className="text-sm text-muted-foreground">Track and manage student counselling sessions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 gradient-pink text-white shadow-md rounded-xl">
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-pink mx-auto flex items-center justify-center mb-2">
              <Heart className="w-6 h-6 text-srivalli-pink" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-orange mx-auto flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-srivalli-orange" />
            </div>
            <p className="text-2xl font-bold text-srivalli-orange">{followUpPending}</p>
            <p className="text-xs text-muted-foreground">Follow-ups Pending</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-teal mx-auto flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-srivalli-teal" />
            </div>
            <p className="text-2xl font-bold text-srivalli-teal">{thisMonthRecords}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 fun-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-srivalli-light-purple mx-auto flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-srivalli-purple" />
            </div>
            <p className="text-2xl font-bold text-srivalli-purple">{academicRecords}</p>
            <p className="text-xs text-muted-foreground">Academic Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <Card className="rounded-2xl border-0 fun-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-srivalli-pink" />
            Counselling Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="max-h-96">
            {records.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-srivalli-light-pink mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No counselling records yet</p>
                <p className="text-muted-foreground text-xs mt-1">Click &quot;New Session&quot; to start tracking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map(record => (
                  <div key={record.id} className="p-4 rounded-xl hover:bg-srivalli-light-purple/10 transition-colors border border-srivalli-light-purple/10">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-srivalli-light-pink text-srivalli-pink text-xs font-bold">
                          {getInitials(getStudentName(record.studentId))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{getStudentName(record.studentId)}</p>
                          <Badge className={`text-[10px] ${getTypeColor(record.type)}`}>
                            {record.type}
                          </Badge>
                          {record.followUpRequired && (
                            <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Follow-up
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(record.date)}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{record.notes}</p>
                        )}
                        {record.followUpRequired && record.followUpDate && (
                          <p className="text-xs text-srivalli-orange mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Follow-up: {formatDate(record.followUpDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-srivalli-pink" />
              New Counselling Session
            </DialogTitle>
            <DialogDescription>
              Record a new student counselling session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Student *</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={studentsError ? "Unable to load students. Please try again." : students.length === 0 ? "No students assigned yet." : "Select a student"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.grade ? ` (Grade ${s.grade})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CounsellingRecord['type'] }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Session notes, observations, recommendations..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-3 p-3 rounded-xl bg-srivalli-light-pink/20">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={form.followUpRequired}
                  onChange={e => setForm(f => ({ ...f, followUpRequired: e.target.checked }))}
                  className="rounded border-gray-500 text-srivalli-pink focus:ring-srivalli-pink"
                />
                <Label htmlFor="followUpRequired" className="text-sm font-medium cursor-pointer">
                  Follow-up required
                </Label>
              </div>
              {form.followUpRequired && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Follow-up Date</Label>
                  <Input
                    type="date"
                    value={form.followUpDate}
                    onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !form.studentId}
              className="gradient-pink text-white shadow-md rounded-xl gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export function TeacherVideoReviews() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, feedback: '', status: '' });

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/student-videos');
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      } else {
        addToast(data.message || 'Failed to fetch videos', 'error');
      }
    } catch {
      addToast('Failed to fetch videos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const openReview = (v: any) => {
    setActiveVideo(v);
    setForm({
      rating: v.rating || 0,
      feedback: v.feedback || '',
      status: v.status || 'Under Review',
    });
    setReviewOpen(true);
  };

  const handleReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/student-videos', {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: activeVideo.id, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Review submitted successfully!');
        setReviewOpen(false);
        fetchVideos();
      } else {
        addToast(data.message || 'Failed to submit review', 'error');
      }
    } catch {
      addToast('Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Video size={24} className="text-srivalli-purple" /> Video Submissions
          </h1>
          <p className="text-muted-foreground text-sm">Review student video assignments</p>
        </div>
      </div>

      <Card className="fun-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="max-h-[600px]">
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-srivalli-light-purple mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No video submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.map(v => (
                  <div key={v.id} className="p-4 rounded-xl border border-srivalli-light-purple/20 bg-white">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{v.title || 'Untitled Video'}</h3>
                          <Badge variant={v.status === 'Reviewed' ? 'default' : 'secondary'} className={v.status === 'Reviewed' ? 'bg-srivalli-teal text-white' : ''}>
                            {v.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{v.description || 'No description provided.'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(v.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" asChild>
                          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} className="mr-2" /> View Video
                          </a>
                        </Button>
                        <Button variant="default" size="sm" onClick={() => openReview(v)} className="bg-srivalli-purple hover:bg-srivalli-purple/90 text-white">
                          <Star size={16} className="mr-2" /> Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Review Video Submission</DialogTitle>
            <DialogDescription>
              {activeVideo?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rating (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) || 0 }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea
                rows={4}
                value={form.feedback}
                onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                placeholder="Provide constructive feedback..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleReview} disabled={submitting} className="bg-srivalli-purple hover:bg-srivalli-purple/90 text-white rounded-xl">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

