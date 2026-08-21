'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, BookOpen, Video, ClipboardList, Brain,
  FolderOpen, BarChart3, Award, Trophy, UserCircle, LogOut,
  Bell, Menu, Home, GraduationCap, Play, ChevronRight,
  ChevronLeft, Download, Share2, Eye, Clock, Star, Target,
  Zap, CheckCircle2, Circle, AlertCircle, Upload, FileText,
  Flame, Medal, Crown, ArrowUpRight, ArrowDown, Loader2,
  X, ChevronDown, Calendar, TrendingUp, Lock, Unlock,
  RotateCcw, Send, Sparkles, Heart, PenTool, Mic, Globe,
  Lightbulb, Users, Shield, MessageCircle, Mail
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
import { useAppStore } from '@/lib/store';
import { useRealtimeStudent } from '@/hooks/useRealtimeStudent';

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

const isFuture = (dateStr: string) => {
  if (!dateStr) return false;
  try { return new Date(dateStr) > new Date(); } catch { return false; }
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

interface ClassItem {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string;
  status?: string;
  meetingLink?: string;
  course?: { id: string; title: string } | null;
  teacher?: { id: string; name: string } | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  dueDate?: string;
  maxMarks: number;
  isActive: boolean;
  course?: { id: string; title: string } | null;
  teacher?: { id: string; name: string } | null;
  submissions?: Array<{
    id: string;
    studentId: string;
    marks?: number | null;
    feedback?: string | null;
    status: string;
  }>;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  timeLimit: number;
  questions: string;
  isActive: boolean;
  course?: { id: string; title: string } | null;
  teacher?: { id: string; name: string } | null;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
}

interface EnrollmentItem {
  id: string;
  courseId: string;
  plan: string;
  status: string;
  startDate: string;
  course?: {
    id: string;
    title: string;
    description: string;
    tagline?: string;
    weeklyFee: number;
    monthlyFee: number;
    duration?: string;
    category?: string;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  badgesCount: number;
  grade?: string;
}

interface CertificateItem {
  id: string;
  certificateCode: string;
  issuedAt: string;
  course?: { id: string; title: string; description?: string } | null;
  issuedBy?: { id: string; name: string } | null;
}

interface EarnedBadgeItem {
  id: string;
  earnedAt: string;
  badge?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: string;
    points: number;
  } | null;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. STUDENT LAYOUT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, screen: 'STUDENT_DASHBOARD' },
  { label: 'My Courses', icon: <BookOpen className="w-5 h-5" />, screen: 'STUDENT_COURSES' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'STUDENT_CLASSES' },
  { label: 'Assignments', icon: <ClipboardList className="w-5 h-5" />, screen: 'STUDENT_ASSIGNMENTS' },
  { label: 'Quizzes', icon: <Brain className="w-5 h-5" />, screen: 'STUDENT_QUIZZES' },
  { label: 'Materials', icon: <FolderOpen className="w-5 h-5" />, screen: 'STUDENT_MATERIALS' },
  { label: 'Progress', icon: <BarChart3 className="w-5 h-5" />, screen: 'STUDENT_PROGRESS' },
  { label: 'Certificates', icon: <Award className="w-5 h-5" />, screen: 'STUDENT_CERTIFICATES' },
  { label: 'Leaderboard', icon: <Trophy className="w-5 h-5" />, screen: 'STUDENT_LEADERBOARD' },
  { label: 'Video Submissions', icon: <Video className="w-5 h-5" />, screen: 'STUDENT_VIDEO_SUBMISSIONS' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'STUDENT_PROFILE' },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Home', icon: <Home className="w-5 h-5" />, screen: 'STUDENT_DASHBOARD' },
  { label: 'Courses', icon: <BookOpen className="w-5 h-5" />, screen: 'STUDENT_COURSES' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'STUDENT_CLASSES' },
  { label: 'Activities', icon: <Zap className="w-5 h-5" />, screen: 'STUDENT_ASSIGNMENTS' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'STUDENT_PROFILE' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const logout = useAppStore(s => s.logout);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-srivalli-light-pink">
        <button onClick={() => { nav('HOME'); onClose?.(); }} className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="text-lg font-bold text-gradient">Srivalli SmartSpeak</span>
        </button>
      </div>

      {/* Student Info */}
      <div className="px-4 py-4 border-b border-srivalli-light-pink/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-srivalli-pink/30">
            <AvatarFallback className="bg-srivalli-light-pink text-srivalli-pink font-bold text-sm">
              {user?.name ? getInitials(user.name) : 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{user?.name || 'Student'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
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
                    ? 'bg-srivalli-light-pink text-srivalli-pink shadow-sm'
                    : 'text-gray-600 hover:bg-srivalli-light-pink/50 hover:text-srivalli-pink'
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

      {/* Logout */}
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

export function StudentLayout({ children }: { children: ReactNode }) {

  const [profileLoading, setProfileLoading] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        if (!user?.uid) return;
        const res = await fetchWithAuth('/api/students?id=' + user.uid);
        const data = await res.json();
        if (mounted && data.success && data.student?.isActive === false) {
          setIsInactive(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };
    checkStatus();
    return () => { mounted = false; };
  }, [user]);

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-srivalli-pink" size={32} /></div>;

  if (isInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-t-4 border-t-red-500">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Your account has been deactivated. Please contact the administrator to restore access.</p>
          <Button onClick={() => useAppStore.getState().logout()} className="w-full bg-red-500 hover:bg-red-600">
            Log Out
          </Button>
        </Card>
      </div>
    );
  }

  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      STUDENT_DASHBOARD: 'Dashboard',
      STUDENT_COURSES: 'My Courses',
      STUDENT_CLASSES: 'Classes',
      STUDENT_ASSIGNMENTS: 'Assignments',
      STUDENT_QUIZZES: 'Quizzes',
      STUDENT_MATERIALS: 'Materials',
      STUDENT_PROGRESS: 'Progress',
      STUDENT_CERTIFICATES: 'Certificates',
      STUDENT_LEADERBOARD: 'Leaderboard',
      STUDENT_PROFILE: 'Profile',
    };
    return titles[screen] || 'Dashboard';
  }, [screen]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-srivalli-light-pink z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-srivalli-light-pink">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-1.5 rounded-lg hover:bg-srivalli-light-pink transition-colors">
                    <Menu className="w-5 h-5 text-srivalli-pink" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SidebarContent onClose={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => addToast('No new notifications', 'info')} className="relative p-2 rounded-full hover:bg-srivalli-light-pink transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-srivalli-pink rounded-full border-2 border-white" />
              </button>
              <Avatar className="h-8 w-8 ring-2 ring-srivalli-pink/20">
                <AvatarFallback className="bg-srivalli-light-pink text-srivalli-pink font-bold text-xs">
                  {user?.name ? getInitials(user.name) : 'S'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 pb-20 lg:pb-6">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-srivalli-light-pink z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-1">
            {BOTTOM_NAV.map(item => {
              const active = screen === item.screen;
              return (
                <button
                  key={item.screen}
                  onClick={() => nav(item.screen)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[56px] ${
                    active ? 'text-srivalli-pink' : 'text-gray-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-srivalli-light-pink' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   2. STUDENT DASHBOARD MAIN
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function StatCard({ icon, label, value, color, bg }: {
  icon: ReactNode; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <Card className="card-hover fun-shadow border-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${bg}`}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function StudentDashMain() {
  const user = useAppStore(s => s.user);
  const studentId = user?.id || '';
  const { classes, assignments, enrollments, badges, attendanceStats: attendance, loading } = useRealtimeStudent(studentId);

  if (loading) return <LoadingSkeleton />;

  const todayClasses = classes.filter(c => isToday(c.date));
  const upcomingClasses = classes.filter(c => isFuture(c.date) && !isToday(c.date)).slice(0, 4);
  const pendingAssignments = assignments.filter(a => {
    const mySub = a.submissions?.find(s => s.studentId === studentId);
    return !mySub && isFuture(a.dueDate || '');
  }).slice(0, 3);

  return (
    <div className="space-y-6 bounce-in">
      {/* Welcome */}
      <div className="gradient-pink rounded-2xl p-5 md:p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-white text-sm font-medium">{getGreeting()}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold">Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 🎉</h2>
        <p className="text-white mt-1 text-sm md:text-base">
          Ready to learn something amazing today? Let&apos;s keep the momentum going!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5 text-srivalli-pink" />} label="My Courses" value={enrollments.filter(e => e.status === 'active').length} color="text-srivalli-pink" bg="bg-srivalli-light-pink" />
        <StatCard icon={<Video className="w-5 h-5 text-srivalli-purple" />} label="Today's Class" value={todayClasses.length > 0 ? 'Yes!' : 'No'} color="text-srivalli-purple" bg="bg-srivalli-light-purple" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-srivalli-teal" />} label="Attendance" value={`${attendance.percentage}%`} color="text-srivalli-teal" bg="bg-srivalli-light-teal" />
        <StatCard icon={<Star className="w-5 h-5 text-srivalli-orange" />} label="Badges" value={badges.length} color="text-srivalli-orange" bg="bg-srivalli-light-orange" />
      </div>

      {/* Today's Class */}
      {todayClasses.length > 0 && (
        <Card className="fun-shadow border-0 overflow-hidden">
          <CardHeader className="bg-srivalli-light-purple pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-srivalli-purple/10 rounded-xl">
                  <Video className="w-5 h-5 text-srivalli-purple" />
                </div>
                <CardTitle className="text-base font-bold">Today&apos;s Class</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {todayClasses.map(cls => (
              <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-srivalli-light-purple/30">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{cls.course?.title || cls.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> {cls.teacher?.name || 'Teacher'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(cls.time)}</span>
                    {cls.duration && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {cls.duration}</span>}
                  </div>
                </div>
                <Button size="sm" onClick={() => cls.meetingLink ? window.open(cls.meetingLink, '_blank') : addToast('Meeting link not available', 'info')} className="gradient-teal text-white rounded-xl shadow-md">
                  <Play className="w-4 h-4 mr-1.5" /> Join Class
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Upcoming Classes */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Classes */}
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-srivalli-purple" /> Upcoming Classes
              </CardTitle>
              <button onClick={() => nav('STUDENT_CLASSES')} className="text-xs text-srivalli-pink font-medium hover:underline">
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming classes 🎉</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-srivalli-light-purple/20 transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-pink flex items-center justify-center text-white text-xs font-bold">
                      {new Date(cls.date).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cls.course?.title || cls.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(cls.date)} · {formatTime(cls.time)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-srivalli-purple/30 text-srivalli-purple">Upcoming</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-srivalli-orange" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2.5">
            {[
              { icon: <Video className="w-5 h-5" />, label: 'Join Class', color: 'bg-srivalli-light-pink text-srivalli-pink', screen: 'STUDENT_CLASSES' },
              { icon: <Brain className="w-5 h-5" />, label: 'Take Quiz', color: 'bg-srivalli-light-purple text-srivalli-purple', screen: 'STUDENT_QUIZZES' },
              { icon: <Send className="w-5 h-5" />, label: 'Submit Work', color: 'bg-srivalli-light-orange text-srivalli-orange', screen: 'STUDENT_ASSIGNMENTS' },
              { icon: <BarChart3 className="w-5 h-5" />, label: 'My Progress', color: 'bg-srivalli-light-teal text-srivalli-teal', screen: 'STUDENT_PROGRESS' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => nav(action.screen)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl ${action.color} hover:opacity-80 transition-all card-hover`}
              >
                {action.icon}
                <span className="text-xs font-semibold">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-srivalli-orange" /> Pending Assignments
            </CardTitle>
            <button onClick={() => nav('STUDENT_ASSIGNMENTS')} className="text-xs text-srivalli-pink font-medium hover:underline">
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up! Great job! 🌟</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingAssignments.map(asgn => (
                <div key={asgn.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-srivalli-light-orange/20 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-srivalli-light-orange flex items-center justify-center">
                    <FileText className="w-5 h-5 text-srivalli-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asgn.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(asgn.dueDate || '')} · {asgn.maxMarks} marks</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-srivalli-orange text-srivalli-orange text-xs" onClick={() => nav('STUDENT_ASSIGNMENTS')}>
                    Submit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   3. STUDENT COURSES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentCourses() {
  const user = useAppStore(s => s.user);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/enrollments?studentId=${user.id}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        const d = await res.json();
        if (!cancelled && d.success) setEnrollments(d.enrollments || []);
        
        const cRes = await fetch('/api/courses');
        const cData = await cRes.json();
        if (!cancelled && cData.success) setAvailableCourses(cData.courses || []);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id, user?.token]);

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ studentId: user.id, courseId, plan: 'Monthly Plan' })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Successfully enrolled!');
        setEnrollments(prev => [data.enrollment, ...prev]);
        setShowEnrollDialog(false);
      } else {
        addToast(data.message || 'Enrollment failed', 'error');
      }
    } catch {
      addToast('Error enrolling in course', 'error');
    }
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>;
  }

  const courseProgresses: Record<string, number> = {};
  enrollments.forEach((_, i) => { courseProgresses[i] = 0; });

  const gradients = [
    'from-pink-500 to-purple-500',
    'from-orange-400 to-pink-500',
    'from-teal-400 to-green-500',
    'from-purple-500 to-indigo-500',
    'from-yellow-400 to-orange-500',
  ];

  return (
    <div className="space-y-6 bounce-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Courses 📚</h2>
          <p className="text-sm text-muted-foreground">Track your enrolled courses and progress</p>
        </div>
        {enrollments.length > 0 && (
          <Button className="gradient-pink text-white rounded-xl" onClick={() => setShowEnrollDialog(true)}>
            <Sparkles className="w-4 h-4 mr-2" /> Explore More Courses
          </Button>
        )}
      </div>

      {enrollments.length === 0 ? (
        <Card className="border-dashed border-2 border-srivalli-pink/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-srivalli-light-pink flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-srivalli-pink" />
            </div>
            <h3 className="text-lg font-bold mb-2">No Courses Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Enroll in a course to get started on your learning journey!</p>
            <Button className="gradient-pink text-white rounded-xl" onClick={() => setShowEnrollDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" /> Explore Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((enroll, idx) => {
            const progress = courseProgresses[idx] || 0;
            const gradient = gradients[idx % gradients.length];
            return (
              <Card key={enroll.id} className="card-hover fun-shadow border-0 overflow-hidden">
                <div className={`h-3 bg-gradient-to-r ${gradient}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 text-[10px] capitalize border-srivalli-purple/30 text-srivalli-purple">
                        {enroll.plan}
                      </Badge>
                      <h3 className="font-bold text-sm truncate">{enroll.course?.title || 'Course'}</h3>
                      <p className="text-xs text-muted-foreground truncate">{enroll.course?.tagline || ''}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold text-srivalli-pink">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {enroll.status !== 'active' ? (
                    <div className="p-2 mt-2 bg-red-50 rounded-lg text-center border border-red-100">
                       <p className="text-xs text-red-600 flex items-center justify-center gap-1"><Lock size={12}/> Access not available.</p>
                       <p className="text-[10px] text-red-500 mt-0.5">Please contact the administrator.</p>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => nav('STUDENT_CLASSES')} className="w-full rounded-xl gradient-pink text-white">
                      Continue Learning <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in a Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {availableCourses.filter(c => !enrollments.some(e => e.courseId === c.id)).map(course => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-sm">{course.title || course.name}</p>
                  <p className="text-xs text-muted-foreground">Monthly Plan</p>
                </div>
                <Button size="sm" onClick={() => handleEnroll(course.id)} className="bg-srivalli-pink hover:bg-srivalli-pink/90 text-white">
                  Enroll
                </Button>
              </div>
            ))}
            {availableCourses.filter(c => !enrollments.some(e => e.courseId === c.id)).length === 0 && (
              <p className="text-sm text-center text-muted-foreground">You are already enrolled in all available courses!</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   4. STUDENT CLASSES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentClasses() {
  const user = useAppStore(s => s.user);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/classes?studentId=${user?.id || ''}`);
        const d = await res.json();
        if (!cancelled && d.success) setClasses(d.classes || []);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => { const cleanup = fetchClasses(); return () => { cleanup?.(); }; }, [fetchClasses]);

  const liveClasses = classes.filter(c => c.status === 'scheduled' && isFuture(c.date));
  const recordedClasses = classes.filter(c => c.status === 'completed');

  const ClassCard = ({ cls }: { cls: ClassItem }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-srivalli-light-pink/50 hover:border-srivalli-pink/30 transition-all card-hover">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-pink flex flex-col items-center justify-center text-white">
        <span className="text-xs font-bold leading-none">{new Date(cls.date).getDate()}</span>
        <span className="text-[9px] font-medium">{new Date(cls.date).toLocaleString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold text-sm truncate">{cls.course?.title || cls.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> {cls.teacher?.name || 'Teacher'}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(cls.time)}</span>
          {cls.duration && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {cls.duration}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isToday(cls.date) ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Live</Badge>
        ) : isFuture(cls.date) ? (
          <Badge variant="outline" className="text-[10px] border-srivalli-purple/30 text-srivalli-purple">Upcoming</Badge>
        ) : null}
        {isToday(cls.date) && (
          <Button size="sm" onClick={() => cls.meetingLink ? window.open(cls.meetingLink, '_blank') : addToast('Meeting link not available', 'info')} className="gradient-teal text-white rounded-xl text-xs">
            <Play className="w-3 h-3 mr-1" /> Join
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Classes 🎥</h2>
        <p className="text-sm text-muted-foreground">Join live sessions or watch recordings</p>
      </div>

      <Tabs defaultValue="live">
        <TabsList className="bg-srivalli-light-pink">
          <TabsTrigger value="live" className="data-[state=active]:bg-srivalli-pink data-[state=active]:text-white rounded-xl text-sm">
            <Video className="w-4 h-4 mr-1.5" /> Live Classes
          </TabsTrigger>
          <TabsTrigger value="recorded" className="data-[state=active]:bg-srivalli-pink data-[state=active]:text-white rounded-xl text-sm">
            <Play className="w-4 h-4 mr-1.5" /> Recorded
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : liveClasses.length === 0 ? (
            <Card className="border-dashed border-2 border-srivalli-pink/30">
              <CardContent className="py-10 text-center">
                <Video className="w-10 h-10 text-srivalli-pink/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming live classes scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {liveClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recorded" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : recordedClasses.length === 0 ? (
            <Card className="border-dashed border-2 border-srivalli-pink/30">
              <CardContent className="py-10 text-center">
                <Play className="w-10 h-10 text-srivalli-pink/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recorded classes available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recordedClasses.map(cls => (
                <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-srivalli-light-pink/50 hover:border-srivalli-pink/30 transition-all card-hover">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-warm flex items-center justify-center text-white">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-sm truncate">{cls.course?.title || cls.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> {cls.teacher?.name || 'Teacher'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(cls.date)}</span>
                      {cls.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.duration}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => cls.meetingLink ? window.open(cls.meetingLink, '_blank') : addToast('Recording not available', 'info')} className="border-srivalli-purple/30 text-srivalli-purple rounded-xl text-xs">
                    <Play className="w-3 h-3 mr-1" /> Watch
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   5. STUDENT ASSIGNMENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentAssignments() {
  const user = useAppStore(s => s.user);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitText, setSubmitText] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/assignments`);
        const d = await res.json();
        if (!cancelled && d.success) setAssignments(d.assignments || []);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (asgnId: string) => {
    if (!submitText.trim() && !submitFileUrl.trim()) return;
    setSubmitting(true);
    try {
      // Actual submission - POST to submissions API
      const res = await fetchWithAuth('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: asgnId, content: submitText, fileUrl: submitFileUrl }),
      });
      if (res.ok) {
        addToast('Assignment submitted successfully! 🎉');
        setSubmitText('');
        setSubmitFileUrl('');
        setExpandedId(null);
      }
    } catch {
      addToast('Failed to submit assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (asgn: AssignmentItem) => {
    const mySub = asgn.submissions?.find(s => s.studentId === user?.id);
    if (!mySub) {
      return <Badge className="bg-srivalli-light-orange text-srivalli-orange border-srivalli-orange/20 text-[10px]">Pending</Badge>;
    }
    if (mySub.status === 'submitted') {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">Awaiting Review</Badge>;
    }
    if (mySub.status === 'reviewed' || mySub.marks !== null) {
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Graded: {mySub.marks}/{asgn.maxMarks}</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{mySub.status}</Badge>;
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Assignments 📝</h2>
        <p className="text-sm text-muted-foreground">Complete and submit your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-dashed border-2 border-srivalli-pink/30">
          <CardContent className="py-10 text-center">
            <ClipboardList className="w-10 h-10 text-srivalli-pink/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No assignments assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map(asgn => {
            const isExpanded = expandedId === asgn.id;
            const mySub = asgn.submissions?.find(s => s.studentId === user?.id);
            const isSubmitted = !!mySub;

            return (
              <Card key={asgn.id} className="fun-shadow border-0 overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : asgn.id)}
                    className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-srivalli-light-pink/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-srivalli-light-pink flex items-center justify-center">
                      {asgn.type === 'writing' ? <PenTool className="w-5 h-5 text-srivalli-pink" /> : <Mic className="w-5 h-5 text-srivalli-pink" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{asgn.title}</p>
                        <Badge variant="outline" className="text-[10px] capitalize border-srivalli-orange/30 text-srivalli-orange">
                          {asgn.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {formatDate(asgn.dueDate || '')}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Max: {asgn.maxMarks} marks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(asgn)}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-srivalli-light-pink/50 space-y-3">
                      <p className="text-sm text-muted-foreground pt-3">{asgn.description || 'Complete the assignment and submit before the deadline.'}</p>

                      {mySub?.feedback && (
                        <div className="p-3 rounded-xl bg-srivalli-light-green">
                          <p className="text-xs font-semibold text-srivalli-teal mb-1">Teacher Feedback âœï¸</p>
                          <p className="text-sm text-foreground">{mySub.feedback}</p>
                        </div>
                      )}

                      {!isSubmitted && (
                        <div className="space-y-2">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Write your answer here..."
                              value={submitText}
                              onChange={e => setSubmitText(e.target.value)}
                              className="min-h-[100px] resize-none rounded-xl border-srivalli-light-pink focus-visible:ring-srivalli-pink"
                            />
                            <Input
                              placeholder="Or paste a Google Drive / YouTube link (e.g., for Speaking video)"
                              value={submitFileUrl}
                              onChange={e => setSubmitFileUrl(e.target.value)}
                              className="rounded-xl border-srivalli-light-pink focus-visible:ring-srivalli-pink"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gradient-pink text-white rounded-xl"
                                onClick={() => handleSubmit(asgn.id)}
                                disabled={submitting || (!submitText.trim() && !submitFileUrl.trim())}
                              >
                                {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                                Submit
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submitted {formatDate(mySub?.submittedAt || '')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6. STUDENT QUIZZES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentQuizzes() {
  const user = useAppStore(s => s.user);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/quizzes`);
        const d = await res.json();
        if (!cancelled && d.success) setQuizzes(d.quizzes || []);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Timer
  useEffect(() => {
    if (quizStarted && !quizFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [quizStarted, quizFinished, timeLeft]);

  const startQuiz = (quiz: QuizItem) => {
    try {
      const parsed = JSON.parse(quiz.questions);
      setQuestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuestions([]);
    }
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setSelectedAnswers({});
    setTimeLeft(quiz.timeLimit || 300);
    setQuizStarted(true);
    setQuizFinished(false);
    setScore(null);
  };

  const handleFinishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    const answers: number[] = [];
    questions.forEach((_, i) => { answers[i] = selectedAnswers[i] ?? -1; });

    // Calculate local score
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.correctAnswer !== undefined && selectedAnswers[i] === q.correctAnswer) correct++;
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Submit to server
    if (user?.id && activeQuiz) {
      try {
        const res = await fetchWithAuth('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: activeQuiz.id,
            studentId: user.id,
            answers: JSON.stringify(answers),
            timeTaken: (activeQuiz.timeLimit || 300) - timeLeft,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('Quiz submitted successfully!', 'success');
        } else {
          addToast(data.message || 'Failed to submit quiz', 'error');
        }
      } catch {
        addToast('Error submitting quiz', 'error');
      }
    }

    setScore({ score: correct, total, percentage });
    setIsSubmitting(false);
    setQuizFinished(true);
    setQuizStarted(false);
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setQuestions([]);
    setCurrentQ(0);
    setSelectedAnswers({});
    setTimeLeft(0);
    setQuizStarted(false);
    setQuizFinished(false);
    setScore(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const q = questions[currentQ];

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Quizzes 🧠 </h2>
        <p className="text-sm text-muted-foreground">Test your knowledge and earn points!</p>
      </div>

      {/* Quiz Dialog */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => { if (!open) resetQuiz(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {!quizFinished ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="truncate pr-4">{activeQuiz?.title}</span>
                  <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                    timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-srivalli-light-teal text-srivalli-teal'
                  }`}>
                    <Clock className="w-4 h-4" />
                    {formatTimer(timeLeft)}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Question {currentQ + 1} of {questions.length}
                </DialogDescription>
              </DialogHeader>

              {/* Progress */}
              <div className="space-y-1">
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />
              </div>

              {q && (
                <div className="space-y-4">
                  <p className="text-base font-semibold">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isSelected = selectedAnswers[currentQ] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQ]: i }))}
                          className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-srivalli-pink bg-srivalli-light-pink text-srivalli-pink font-medium'
                              : 'border-srivalli-light-pink/50 hover:border-srivalli-pink/30'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-srivalli-pink text-white' : 'bg-srivalli-light-pink/50 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter className="flex-row gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button
                    className="flex-1 rounded-xl gradient-pink text-white"
                    onClick={() => setCurrentQ(prev => prev + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 rounded-xl gradient-teal text-white"
                    onClick={handleFinishQuiz}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} 
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : score ? (
            <>
              <DialogHeader>
                <DialogTitle>Quiz Complete! 🎉</DialogTitle>
                <DialogDescription>Here&apos;s how you did</DialogDescription>
              </DialogHeader>
              <div className="text-center space-y-4 py-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold ${
                  score.percentage >= 80 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                  score.percentage >= 50 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  'bg-gradient-to-br from-red-400 to-pink-500'
                }`}>
                  {score.percentage}%
                </div>
                <div>
                  <p className="text-2xl font-bold">{score.score} / {score.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {score.percentage >= 80 ? '🌟 Excellent work!' : score.percentage >= 50 ? '👍 Good effort!' : '💪 Keep practicing!'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={resetQuiz}>Close</Button>
                <Button className="flex-1 rounded-xl gradient-pink text-white" onClick={() => { if (activeQuiz) startQuiz(activeQuiz); }}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Retry
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Quiz Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed border-2 border-srivalli-pink/30">
          <CardContent className="py-10 text-center">
            <Brain className="w-10 h-10 text-srivalli-pink/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No quizzes available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map(quiz => {
            let qCount = 0;
            try { qCount = JSON.parse(quiz.questions).length; } catch {}
            const colors = ['bg-srivalli-light-pink text-srivalli-pink', 'bg-srivalli-light-purple text-srivalli-purple', 'bg-srivalli-light-teal text-srivalli-teal', 'bg-srivalli-light-orange text-srivalli-orange'];
            const icons = [<PenTool key="p" className="w-6 h-6" />, <Mic key="m" className="w-6 h-6" />, <Brain key="b" className="w-6 h-6" />, <Lightbulb key="l" className="w-6 h-6" />];

            return (
              <Card key={quiz.id} className="card-hover fun-shadow border-0">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${colors[quizzes.indexOf(quiz) % colors.length]}`}>
                      {icons[quizzes.indexOf(quiz) % icons.length]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{quiz.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {qCount} questions</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor((quiz.timeLimit || 300) / 60)} min</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full rounded-xl gradient-warm text-white"
                    onClick={() => startQuiz(quiz)}
                  >
                    <Brain className="w-4 h-4 mr-1.5" /> Start Quiz
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   7. STUDENT PROGRESS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentProgress() {
  const user = useAppStore(s => s.user);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [badges, setBadges] = useState<EarnedBadgeItem[]>([]);
  const [attendance, setAttendance] = useState<{ total: number; present: number; absent: number; percentage: number }>({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [enrollRes, badgeRes, attendRes] = await Promise.allSettled([
          fetchWithAuth(`/api/enrollments?studentId=${user?.id || ''}`),
          fetchWithAuth(`/api/badges?studentId=${user?.id || ''}`),
          fetchWithAuth(`/api/attendance?studentId=${user?.id || ''}`),
        ]);

        if (cancelled) return;
        if (enrollRes.status === 'fulfilled') {
          const d = await enrollRes.value.json();
          if (d.success) setEnrollments(d.enrollments || []);
        }
        if (badgeRes.status === 'fulfilled') {
          const d = await badgeRes.value.json();
          if (d.success) setBadges(d.earnedBadges || []);
        }
        if (attendRes.status === 'fulfilled') {
          const d = await attendRes.value.json();
          if (d.success && d.stats) setAttendance(d.stats);
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [user?.id]);

  const courseProgresses = enrollments.map((e, i) => ({
    name: e.course?.title || 'Course',
    progress: Math.min(100, Math.round(((attendance.percentage || 0) + (badges.length * 10)) / 2) || 0), // Simple dynamic formula
    color: i % 2 === 0 ? 'bg-srivalli-pink' : 'bg-srivalli-purple'
  }));

  const activityBreakdown = [
    { label: 'Activities', progress: Math.min(100, (badges.length * 20) || 0), icon: <Zap className="w-4 h-4" />, color: 'text-srivalli-pink' },
    { label: 'Quizzes', progress: Math.min(100, (badges.length * 15) || 0), icon: <Brain className="w-4 h-4" />, color: 'text-srivalli-purple' },
    { label: 'Attendance', progress: attendance.percentage || 0, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-srivalli-teal' },
  ];

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">My Progress 📊</h2>
        <p className="text-sm text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Overall Progress */}
      <Card className="fun-shadow border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg aria-hidden="true" className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#FCE4EC" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E91E63" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${78 * 3.27} ${100 * 3.27}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-srivalli-pink">78%</span>
                <span className="text-xs text-muted-foreground">Overall</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <h3 className="text-lg font-bold">Great Progress! 🌟</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;re doing amazing! Keep up the great work and continue your learning streak.
              </p>
              <div className="flex items-center gap-4 justify-center sm:justify-start text-sm">
                <span className="flex items-center gap-1 text-srivalli-pink"><Flame className="w-4 h-4" /> 7 day streak</span>
                <span className="flex items-center gap-1 text-srivalli-teal"><Star className="w-4 h-4" /> {badges.length} badges</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course-wise Progress */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Course Progress 📚</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {courseProgresses.map(cp => (
            <div key={cp.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{cp.name}</span>
                <span className="font-bold text-srivalli-pink">{cp.progress}%</span>
              </div>
              <Progress value={cp.progress} className="h-2.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Activity Breakdown âš¡</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid sm:grid-cols-3 gap-4">
          {activityBreakdown.map(ab => (
            <div key={ab.label} className="text-center space-y-2 p-3 rounded-xl bg-srivalli-light-pink/30">
              <div className={`${ab.color}`}>{ab.icon}</div>
              <p className="text-2xl font-extrabold text-foreground">{ab.progress}%</p>
              <p className="text-xs text-muted-foreground">{ab.label}</p>
              <Progress value={ab.progress} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-srivalli-teal" /> Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-srivalli-light-teal/30">
              <p className="text-2xl font-extrabold text-srivalli-teal">{attendance.percentage}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-srivalli-light-green/30">
              <p className="text-2xl font-extrabold text-srivalli-green">{attendance.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50">
              <p className="text-2xl font-extrabold text-srivalli-red">{attendance.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-srivalli-orange" /> Badges Earned ({badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keep learning to earn your first badge! ðŸ†</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.slice(0, 8).map(eb => (
                <div key={eb.id} className="text-center p-3 rounded-xl bg-srivalli-light-orange/20 space-y-1.5">
                  <span className="text-3xl">{eb.badge?.icon || 'ðŸ…'}</span>
                  <p className="text-xs font-semibold truncate">{eb.badge?.name || 'Badge'}</p>
                  <p className="text-[10px] text-muted-foreground">{eb.badge?.description || ''}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   8. STUDENT LEADERBOARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const LB_CATEGORIES = [
  { label: 'Overall', icon: <Trophy className="w-4 h-4" /> },
  { label: 'Best Speaker', icon: <Mic className="w-4 h-4" /> },
  { label: 'Best Writer', icon: <PenTool className="w-4 h-4" /> },
  { label: 'Most Active', icon: <Flame className="w-4 h-4" /> },
  { label: 'Quiz Champion', icon: <Brain className="w-4 h-4" /> },
];

export function StudentLeaderboard() {
  const user = useAppStore(s => s.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Overall');

  useEffect(() => {
    fetchWithAuth(`/api/leaderboard`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setLeaderboard(d.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', emoji: '👑', label: '1st' };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-gray-200 to-gray-400', emoji: '🥈', label: '2nd' };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-orange-200 to-orange-400', emoji: '🥉', label: '3rd' };
    return null;
  };

  const displayList = category === 'Overall' ? leaderboard :
    leaderboard.filter(e => {
      const g = parseInt(e.grade || '0');
      if (category === 'Grade 1-3') return g >= 1 && g <= 3;
      if (category === 'Grade 4-6') return g >= 4 && g <= 6;
      if (category === 'Grade 7-9') return g >= 7 && g <= 9;
      return false;
    });

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard ðŸ†</h2>
        <p className="text-sm text-muted-foreground">See how you rank among your peers</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {LB_CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => setCategory(cat.label)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              category === cat.label
                ? 'gradient-pink text-white shadow-md'
                : 'bg-srivalli-light-pink/50 text-gray-600 hover:bg-srivalli-light-pink'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {!loading && displayList.length >= 3 && category === 'Overall' && (
        <Card className="fun-shadow border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              {/* 2nd */}
              <div className="text-center flex-1 max-w-[120px]">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-xl mx-auto mb-2 ring-4 ring-gray-200">
                  {getRankStyle(2)?.emoji}
                </div>
                <p className="text-xs font-bold truncate">{displayList[1]?.name || '---'}</p>
                <p className="text-xs text-muted-foreground">{displayList[1]?.points || 0} pts</p>
                <div className="h-16 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl mt-2" />
              </div>
              {/* 1st */}
              <div className="text-center flex-1 max-w-[120px]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-2xl mx-auto mb-2 ring-4 ring-yellow-200">
                  👑
                </div>
                <p className="text-sm font-bold truncate">{displayList[0]?.name || '---'}</p>
                <p className="text-xs text-muted-foreground">{displayList[0]?.points || 0} pts</p>
                <div className="h-24 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-xl mt-2" />
              </div>
              {/* 3rd */}
              <div className="text-center flex-1 max-w-[120px]">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-xl mx-auto mb-2 ring-4 ring-orange-200">
                  {getRankStyle(3)?.emoji}
                </div>
                <p className="text-xs font-bold truncate">{displayList[2]?.name || '---'}</p>
                <p className="text-xs text-muted-foreground">{displayList[2]?.points || 0} pts</p>
                <div className="h-12 bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-xl mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <Card className="fun-shadow border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-srivalli-light-pink/30">
              {displayList.slice(0, 10).map((entry) => {
                const rankStyle = getRankStyle(entry.rank);
                const isMe = user?.id === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-all ${
                      isMe ? 'bg-srivalli-light-pink/50' : 'hover:bg-srivalli-light-pink/20'
                    }`}
                  >
                    <div className="w-8 flex-shrink-0 text-center">
                      {rankStyle ? (
                        <div className={`w-8 h-8 rounded-full ${rankStyle.bg} flex items-center justify-center text-sm font-bold`}>
                          {entry.rank}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                      )}
                    </div>
                    <Avatar className="h-9 w-9 ring-2 ring-srivalli-light-pink">
                      <AvatarFallback className="bg-srivalli-light-pink text-srivalli-pink font-bold text-xs">
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {entry.name}
                        {isMe && <Badge className="bg-srivalli-pink text-white text-[9px] px-1.5 py-0">You</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.badgesCount} badges{entry.grade ? ` · Grade ${entry.grade}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-srivalli-pink">{entry.points}</p>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   9. STUDENT CERTIFICATES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentCertificates() {
  const user = useAppStore(s => s.user);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCert, setViewingCert] = useState<CertificateItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/certificates?studentId=${user?.id || ''}`);
        const d = await res.json();
        if (!cancelled && d.success) setCertificates(d.certificates || []);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Certificates 🎓</h2>
        <p className="text-sm text-muted-foreground">Your earned certificates and achievements</p>
      </div>

      {/* View Certificate Dialog */}
      <Dialog open={!!viewingCert} onOpenChange={(open) => { if (!open) setViewingCert(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-srivalli-pink" /> Certificate
            </DialogTitle>
          </DialogHeader>
          {viewingCert && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-srivalli-pink/30 rounded-xl p-6 text-center bg-srivalli-light-pink/10 space-y-3">
                <span className="text-4xl">🎓</span>
                <h3 className="font-bold text-lg">{viewingCert.course?.title || 'Course'}</h3>
                <p className="text-sm text-muted-foreground">
                  This certifies that <strong className="text-srivalli-pink">{user?.name}</strong> has successfully completed the course.
                </p>
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Date: {formatDate(viewingCert.issuedAt)}</span>
                  <span>ID: {viewingCert.certificateCode}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl gradient-pink text-white" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`<html><head><title>Certificate - ${viewingCert?.certificateCode}</title></head><body style="text-align:center; padding: 50px; font-family: sans-serif;"><h1>Certificate of Completion</h1><p>This certifies completion of</p><h2>${viewingCert?.course?.title || 'Course'}</h2><p>Code: ${viewingCert?.certificateCode}</p><script>window.print();</script></body></html>`);
                    printWindow.document.close();
                  }
                }}>
                  <Download className="w-4 h-4 mr-1.5" /> Download
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl border-srivalli-purple/30 text-srivalli-purple" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/verify/' + viewingCert?.certificateCode)
                    .then(() => addToast('Share link copied!', 'success'))
                    .catch(() => addToast('Failed to copy', 'error'));
                }}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {certificates.length === 0 ? (
        <Card className="border-dashed border-2 border-srivalli-pink/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-srivalli-light-pink flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-srivalli-pink" />
            </div>
            <h3 className="text-lg font-bold mb-2">No Certificates Yet</h3>
            <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <Card key={cert.id} className="card-hover fun-shadow border-0 overflow-hidden">
              <div className="gradient-pink p-4 text-white flex items-center gap-3">
                <Award className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{cert.course?.title || 'Course Certificate'}</p>
                  <p className="text-xs text-white">Issued: {formatDate(cert.issuedAt)}</p>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono bg-srivalli-light-pink px-2 py-0.5 rounded text-srivalli-pink">
                    {cert.certificateCode}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => setViewingCert(cert)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`<html><head><title>Certificate - ${cert.certificateCode}</title></head><body style="text-align:center; padding: 50px; font-family: sans-serif;"><h1>Certificate of Completion</h1><p>This certifies completion of</p><h2>${cert.course?.title || 'Course'}</h2><p>Code: ${cert.certificateCode}</p><script>window.print();</script></body></html>`);
                      printWindow.document.close();
                    }
                  }}>
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/verify/' + cert.certificateCode)
                      .then(() => addToast('Share link copied!', 'success'))
                      .catch(() => addToast('Failed to copy', 'error'));
                  }}>
                    <Share2 className="w-3 h-3 mr-1" /> Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   10. STUDENT PROFILE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function StudentProfile() {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', age: '', grade: '', schoolName: '' });
  const [enrollCount, setEnrollCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { if (!cancelled) setLoading(false); return; }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: String((user as Record<string, unknown>).age || ''),
        grade: String((user as Record<string, unknown>).grade || ''),
        schoolName: String((user as Record<string, unknown>).schoolName || ''),
      });

      try {
        const [enrollRes, badgeRes] = await Promise.allSettled([
          fetchWithAuth(`/api/enrollments?studentId=${user.id}`).then(r => r.json()),
          fetchWithAuth(`/api/badges?studentId=${user.id}`).then(r => r.json()),
        ]);
        if (cancelled) return;
        if (enrollRes.status === 'fulfilled' && enrollRes.value.success) setEnrollCount(enrollRes.value.total || 0);
        if (badgeRes.status === 'fulfilled' && badgeRes.value.success) setBadgeCount(badgeRes.value.totalEarned || 0);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetchWithAuth('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...formData }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Profile updated successfully!', 'success');
        setEditMode(false);
      } else {
        addToast(data.message || 'Update failed', 'error');
      }
    } catch {
      addToast('Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">My Profile 👤</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="fun-shadow border-0 overflow-hidden">
        <div className="gradient-pink p-6 text-white text-center">
          <Avatar className="w-20 h-20 mx-auto ring-4 ring-white/30 mb-3">
            <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
              {user?.name ? getInitials(user.name) : 'S'}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold">{user?.name || 'Student'}</h3>
          <p className="text-white text-sm">{user?.email || ''}</p>
          <Badge className="mt-2 bg-black/30 text-white border-white/50 text-xs">🦋 Student</Badge>
        </div>
        <CardContent className="p-5 space-y-4">
          {editMode ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Age</Label>
                <Input value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Grade</Label>
                <Input value={formData.grade} onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">School Name</Label>
                <Input value={formData.schoolName} onChange={e => setFormData(p => ({ ...p, schoolName: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button className="flex-1 rounded-xl gradient-pink text-white" onClick={handleSave}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: <UserCircle className="w-4 h-4" />, label: 'Name', value: user?.name || '-' },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: user?.email || '-' },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Age', value: String((user as Record<string, unknown>).age || '-') },
                  { icon: <GraduationCap className="w-4 h-4" />, label: 'Grade', value: String((user as Record<string, unknown>).grade || '-') },
                  { icon: <Globe className="w-4 h-4" />, label: 'School', value: String((user as Record<string, unknown>).schoolName || '-') },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm p-2 rounded-xl bg-srivalli-light-pink/20">
                    <span className="text-srivalli-pink">{item.icon}</span>
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl border-srivalli-pink/30 text-srivalli-pink" onClick={() => setEditMode(true)}>
                âœï¸ Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-hover border-0 text-center p-4">
          <BookOpen className="w-6 h-6 text-srivalli-pink mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-pink">{enrollCount}</p>
          <p className="text-xs text-muted-foreground">Courses</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <Award className="w-6 h-6 text-srivalli-orange mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-orange">{badgeCount}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <Star className="w-6 h-6 text-srivalli-purple mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-purple">{(user as Record<string, unknown>).points || 0}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </Card>
      </div>

      {/* Logout */}
      <Card className="border-0">
        <CardContent className="p-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </CardContent>
      </Card>
    </div>
  );
}


export function StudentVideoSubmissions() {
  const [videos, setVideos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', description: '', videoUrl: '' });

  const fetchData = useCallback(async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        fetchWithAuth('/api/student-videos'),
        fetchWithAuth('/api/student-courses')
      ]);
      const vData = await vRes.json();
      const cData = await cRes.json();
      
      if (vData.success) setVideos(vData.videos);
      if (cData.success) {
        // extract courses from enrollments
        const enrolledCourses = cData.enrollments?.map((e: any) => e.course).filter(Boolean) || [];
        setCourses(enrolledCourses);
      }
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async () => {
    if (!form.courseId || !form.videoUrl) {
      addToast('Course and Video URL are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/student-videos', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Video submitted successfully!');
        setUploadOpen(false);
        setForm({ courseId: '', title: '', description: '', videoUrl: '' });
        fetchData();
      } else {
        addToast(data.message || 'Failed to submit video', 'error');
      }
    } catch {
      addToast('Failed to submit video', 'error');
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
            <Video size={24} className="text-srivalli-pink" /> My Video Submissions
          </h1>
          <p className="text-muted-foreground text-sm">Upload and track your video assignments</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gradient-pink text-white shadow-md rounded-xl gap-2">
          <Plus size={16} /> New Submission
        </Button>
      </div>

      <Card className="fun-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="max-h-[600px]">
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-srivalli-light-pink mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No videos submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.map(v => (
                  <div key={v.id} className="p-4 rounded-xl border border-srivalli-light-pink/20 bg-white">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{v.title || 'Untitled Video'}</h3>
                          <Badge variant={v.status === 'Reviewed' ? 'default' : 'secondary'} className={v.status === 'Reviewed' ? 'bg-srivalli-teal text-white' : ''}>
                            {v.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{v.description || 'No description provided.'}</p>
                        
                        {v.rating !== null && (
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-4 h-4 text-amber-400 fill-current" />
                            <span className="text-sm font-medium">{v.rating}/10</span>
                          </div>
                        )}
                        {v.feedback && (
                          <div className="mt-2 p-3 bg-srivalli-light-purple/20 rounded-lg">
                            <p className="text-sm italic text-gray-700">&quot;{v.feedback}&quot;</p>
                          </div>
                        )}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Submit New Video</DialogTitle>
            <DialogDescription>
              Provide the YouTube or Google Drive URL for your video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={form.courseId} onValueChange={v => setForm(f => ({ ...f, courseId: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="E.g., Final Public Speaking Project"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL *</Label>
              <Input
                value={form.videoUrl}
                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://youtu.be/..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional notes for your teacher..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpload} disabled={submitting || !form.courseId || !form.videoUrl} className="gradient-pink text-white rounded-xl">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              Submit Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

