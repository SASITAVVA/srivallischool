'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, Video, CreditCard, Award, UserCircle, LogOut,
  Bell, Menu, Home, ChevronRight, Download, Eye, Clock, Star,
  CheckCircle2, Circle, AlertCircle, Calendar, X, BarChart3, Phone, Mail, MapPin, Edit3,
  FileText, Heart, Shield, ArrowUpRight, MessageSquare,
  Baby, BookOpen, CircleDot, Share2, ArrowRight, Receipt, UserCheck, RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

/* ===== helpers ===== */
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
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
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
  try { return new Date(dateStr).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]; } catch { return false; }
};

const isFuture = (dateStr: string) => {
  if (!dateStr) return false;
  try { return new Date(dateStr) > new Date(); } catch { return false; }
};

const isPast = (dateStr: string) => {
  if (!dateStr) return false;
  try { return new Date(dateStr) < new Date(); } catch { return false; }
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

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
};

const getChildColor = (idx: number) => {
  const colors = [
    { bg: 'bg-srivalli-light-pink', text: 'text-srivalli-pink', ring: 'ring-srivalli-pink/30' },
    { bg: 'bg-srivalli-light-teal', text: 'text-srivalli-teal', ring: 'ring-srivalli-teal/30' },
    { bg: 'bg-srivalli-light-orange', text: 'text-srivalli-orange', ring: 'ring-srivalli-orange/30' },
    { bg: 'bg-srivalli-light-purple', text: 'text-srivalli-purple', ring: 'ring-srivalli-purple/30' },
  ];
  return colors[idx % colors.length];
};

/* ===== TYPES ===== */

interface NavItem {
  label: string;
  icon: ReactNode;
  screen: import('@/lib/store').Screen;
}

interface StudentChild {
  id: string;
  name: string;
  email?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  grade?: string | null;
  schoolName?: string | null;
  points: number;
  gender?: string | null;
}

interface ClassItem {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string | null;
  status?: string | null;
  meetingLink?: string | null;
  course?: { id: string; title: string; category?: string | null } | null;
  teacher?: { id: string; name: string } | null;
  _studentId?: string;
  _studentName?: string;
}

interface NotificationItem {
  id: string;
  isRead: boolean;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type?: string | null;
    createdAt: string;
  };
}

interface PaymentItem {
  id: string;
  amount: number;
  plan: string;
  transactionId?: string | null;
  method?: string | null;
  status: string;
  invoiceUrl?: string | null;
  createdAt: string;
  enrollment: {
    id: string;
    status: string;
    startDate: string;
    endDate?: string | null;
    course: { title: string } | null;
    student: { id: string; name: string } | null;
  };
}

interface CertificateItem {
  id: string;
  certificateCode: string;
  issuedAt: string;
  course?: { id: string; title: string; description?: string | null } | null;
  issuedBy?: { id: string; name: string } | null;
  _studentId?: string;
  _studentName?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface EnrollmentItem {
  id: string;
  courseId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  course?: { id: string; title: string; category?: string | null } | null;
}

/* ================================================
   1. PARENT LAYOUT
   ================================================ */

const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, screen: 'PARENT_DASHBOARD' },
  { label: 'My Children', icon: <Users className="w-5 h-5" />, screen: 'PARENT_CHILDREN' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'PARENT_CLASSES' },
  { label: 'Payments', icon: <CreditCard className="w-5 h-5" />, screen: 'PARENT_PAYMENTS' },
  { label: 'Certificates', icon: <Award className="w-5 h-5" />, screen: 'PARENT_CERTIFICATES' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'STUDENT_PROFILE' },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Dashboard', icon: <Home className="w-5 h-5" />, screen: 'PARENT_DASHBOARD' },
  { label: 'Progress', icon: <BarChart3 className="w-5 h-5" />, screen: 'PARENT_CHILDREN' },
  { label: 'Classes', icon: <Video className="w-5 h-5" />, screen: 'PARENT_CLASSES' },
  { label: 'Payments', icon: <CreditCard className="w-5 h-5" />, screen: 'PARENT_PAYMENTS' },
  { label: 'Profile', icon: <UserCircle className="w-5 h-5" />, screen: 'STUDENT_PROFILE' },
];

function ParentSidebarContent({ onClose }: { onClose?: () => void }) {
  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const logout = useAppStore(s => s.logout);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-5 border-b border-srivalli-light-pink">
        <button onClick={() => { nav('HOME'); onClose?.(); }} className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="text-lg font-bold text-gradient">Srivalli SmartSpeak</span>
        </button>
      </div>

      <div className="px-4 py-4 border-b border-srivalli-light-pink/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-srivalli-purple/30">
            <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple font-bold text-sm">
              {user?.name ? getInitials(user.name) : 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{user?.name || 'Parent'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.mobile || user?.email || ''}</p>
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

export function ParentLayout({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user);
  const screen = useAppStore(s => s.screen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const pageTitle = useMemo(() => {
    const titles: Record<string, string> = {
      PARENT_DASHBOARD: 'Dashboard',
      PARENT_CHILDREN: 'My Children',
      PARENT_CLASSES: 'Classes',
      PARENT_PAYMENTS: 'Payments',
      PARENT_CERTIFICATES: 'Certificates',
      STUDENT_PROFILE: 'Profile',
    };
    return titles[screen] || 'Dashboard';
  }, [screen]);

  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`/api/notifications?userId=${user.id}&userType=parent`)
      .then(r => r.json())
      .then(d => { if (d.success) setNotifCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [user?.id]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-srivalli-light-pink z-40">
        <ParentSidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <ParentSidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-srivalli-light-pink">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-1.5 rounded-lg hover:bg-srivalli-light-purple/30 transition-colors">
                    <Menu className="w-5 h-5 text-srivalli-purple" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <ParentSidebarContent onClose={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-srivalli-light-purple/30 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-srivalli-pink rounded-full border-2 border-white" />
                )}
              </button>
              <Avatar className="h-8 w-8 ring-2 ring-srivalli-purple/20">
                <AvatarFallback className="bg-srivalli-light-purple text-srivalli-purple font-bold text-xs">
                  {user?.name ? getInitials(user.name) : 'P'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 pb-20 lg:pb-6">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-srivalli-light-pink z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-1">
            {BOTTOM_NAV.map(item => {
              const active = screen === item.screen;
              return (
                <button
                  key={item.screen}
                  onClick={() => nav(item.screen)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[56px] ${
                    active ? 'text-srivalli-purple' : 'text-gray-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-srivalli-light-purple' : ''}`}>
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


/* ================================================
   SHARED COMPONENTS
   ================================================ */

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

function DashLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Card className="border-dashed border-2 border-srivalli-pink/30">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-srivalli-light-pink flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function AttendanceBar({ percentage, small }: { percentage: number; small?: boolean }) {
  const color = percentage >= 80 ? 'bg-srivalli-green' : percentage >= 60 ? 'bg-srivalli-orange' : 'bg-red-500';
  const textColor = percentage >= 80 ? 'text-srivalli-green' : percentage >= 60 ? 'text-srivalli-orange' : 'text-red-500';
  return (
    <div className="space-y-1">
      <div className={small ? 'h-1.5 w-full bg-gray-100 rounded-full overflow-hidden' : 'h-2.5 w-full bg-gray-100 rounded-full overflow-hidden'}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className={`text-xs font-bold ${textColor}`}>{percentage}% attendance</p>
    </div>
  );
}

/* ================================================
   2. PARENT DASHBOARD MAIN
   ================================================ */

export function ParentDashMain() {
  const user = useAppStore(s => s.user);
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [childAttendance, setChildAttendance] = useState<Record<string, AttendanceStats>>({});
  const [childEnrollments, setChildEnrollments] = useState<Record<string, EnrollmentItem[]>>({});

  const parentId = user?.id || '';

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [parentRes, notifRes] = await Promise.allSettled([
          fetchWithAuth(`/api/parents?id=${parentId}`).then(r => r.json()),
          fetchWithAuth(`/api/notifications?userId=${parentId}&userType=parent`).then(r => r.json()),
        ]);

        if (cancelled) return;

        let students: StudentChild[] = [];
        let parentPayments: PaymentItem[] = [];

        if (parentRes.status === 'fulfilled' && parentRes.value.success) {
          students = (parentRes.value.students || []) as StudentChild[];
          parentPayments = (parentRes.value.payments || []) as PaymentItem[];
          setChildren(students);
          setPayments(parentPayments);
        }

        if (notifRes.status === 'fulfilled' && notifRes.value.success) {
          setNotifications((notifRes.value.notifications || []) as NotificationItem[]);
        }

        if (students.length > 0) {
          const classPromises = students.map(s =>
            fetchWithAuth(`/api/classes?studentId=${s.id}`).then(r => r.json())
          );
          const classResults = await Promise.allSettled(classPromises);
          if (cancelled) return;

          const merged: ClassItem[] = [];
          classResults.forEach((cr, idx) => {
            if (cr.status === 'fulfilled' && cr.value.success) {
              const cls = (cr.value.classes || []) as ClassItem[];
              merged.push(...cls.map(c => ({ ...c, _studentId: students[idx].id, _studentName: students[idx].name })));
            }
          });
          setAllClasses(merged);

          const attendPromises = students.map(s =>
            fetchWithAuth(`/api/attendance?studentId=${s.id}`).then(r => r.json())
          );
          const attendResults = await Promise.allSettled(attendPromises);
          if (cancelled) return;
          const attendMap: Record<string, AttendanceStats> = {};
          attendResults.forEach((ar, idx) => {
            if (ar.status === 'fulfilled' && ar.value.success && ar.value.stats) {
              attendMap[students[idx].id] = ar.value.stats;
            }
          });
          setChildAttendance(attendMap);

          const enrollPromises = students.map(s =>
            fetchWithAuth(`/api/enrollments?studentId=${s.id}`).then(r => r.json())
          );
          const enrollResults = await Promise.allSettled(enrollPromises);
          if (cancelled) return;
          const enrollMap: Record<string, EnrollmentItem[]> = {};
          enrollResults.forEach((er, idx) => {
            if (er.status === 'fulfilled' && er.value.success) {
              enrollMap[students[idx].id] = er.value.enrollments || [];
            }
          });
          setChildEnrollments(enrollMap);
        }
      } catch {
        /* graceful fail */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [parentId]);

  if (loading) return <DashLoadingSkeleton />;

  const activePayments = payments.filter(p =>
    p.enrollment?.status === 'active' && p.status === 'completed'
  );
  const latestPayment = activePayments[0];
  const upcomingClasses = allClasses
    .filter(c => isFuture(c.date) || isToday(c.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);
  const unreadNotifs = notifications.filter(n => !n.isRead).slice(0, 5);

  return (
    <div className="space-y-6 bounce-in">
      {/* Welcome Banner */}
      <div className="gradient-warm rounded-2xl p-5 md:p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5" />
          <span className="text-white text-sm font-medium">{getGreeting()}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0] || 'Parent'}! 🌺</h2>
        <p className="text-white mt-1 text-sm md:text-base">
          {children.length === 0
            ? 'No children linked to your account yet.'
            : children.length === 1
              ? `Track your child's learning journey and stay updated on their progress.`
              : `Track your ${children.length} children's learning journeys and stay updated.`}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Baby className="w-5 h-5 text-srivalli-pink" />}
          label="Children"
          value={children.length}
          color="text-srivalli-pink"
          bg="bg-srivalli-light-pink"
        />
        <StatCard
          icon={<Video className="w-5 h-5 text-srivalli-purple" />}
          label="Upcoming Classes"
          value={upcomingClasses.length}
          color="text-srivalli-purple"
          bg="bg-srivalli-light-purple"
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5 text-srivalli-teal" />}
          label="Active Plans"
          value={activePayments.length}
          color="text-srivalli-teal"
          bg="bg-srivalli-light-teal"
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-srivalli-orange" />}
          label="Notifications"
          value={unreadNotifs.length}
          color="text-srivalli-orange"
          bg="bg-srivalli-light-orange"
        />
      </div>

      {/* Children Cards */}
      {children.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-srivalli-purple" /> Your Children
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {children.map((child, idx) => {
              const cc = getChildColor(idx);
              const enrollments = childEnrollments[child.id] || [];
              const activeCourses = enrollments.filter(e => e.status === 'active').length;
              const att = childAttendance[child.id];
              return (
                <Card key={child.id} className="card-hover fun-shadow border-0 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className={`h-12 w-12 ring-2 ${cc.ring}`}>
                        <AvatarFallback className={`${cc.bg} ${cc.text} font-bold text-sm`}>
                          {getInitials(child.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {child.grade ? `Grade ${child.grade}` : 'No grade'} · {child.age ? `${child.age} yrs` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <BookOpen className="w-3 h-3 mr-0.5" /> {activeCourses} course{activeCourses !== 1 ? 's' : ''}
                          </Badge>
                          {att && (
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${att.percentage >= 80 ? 'text-srivalli-green' : att.percentage >= 60 ? 'text-srivalli-orange' : 'text-red-500'}`}>
                              <CircleDot className="w-3 h-3 mr-0.5" /> {att.percentage}% attend.
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-srivalli-orange">
                            <Star className="w-3 h-3 mr-0.5" /> {child.points} pts
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {att && (
                      <div className="mt-3">
                        <AttendanceBar percentage={att.percentage} small />
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 rounded-xl text-xs border-srivalli-purple/30 ${cc.text}`}
                        onClick={() => nav('PARENT_CHILDREN')}
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" /> Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl text-xs"
                        onClick={() => nav('PARENT_CLASSES')}
                      >
                        <Video className="w-3.5 h-3.5 mr-1" /> Classes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {children.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8 text-srivalli-pink" />}
          title="No Children Linked"
          description="Contact the school to link your children to your parent account."
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Notifications */}
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-srivalli-orange" /> Notifications
              {unreadNotifs.length > 0 && (
                <Badge className="bg-srivalli-pink text-white text-[10px] px-1.5">{unreadNotifs.length} new</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {unreadNotifs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All caught up! 🎉</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unreadNotifs.map(n => (
                  <div key={n.id} className="flex gap-3 p-2.5 rounded-xl bg-srivalli-light-orange/20">
                    <div className="p-1.5 rounded-lg bg-srivalli-orange/10 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-srivalli-orange" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{n.notification.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{n.notification.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Video className="w-5 h-5 text-srivalli-purple" /> Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes scheduled.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingClasses.map(cls => {
                  const today = isToday(cls.date);
                  return (
                    <div key={cls.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-srivalli-light-purple/20">
                      <div className={`p-2 rounded-xl text-center flex-shrink-0 ${today ? 'bg-srivalli-pink/10' : 'bg-srivalli-purple/10'}`}>
                        <p className={`text-xs font-bold ${today ? 'text-srivalli-pink' : 'text-srivalli-purple'}`}>
                          {new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className={`text-[10px] ${today ? 'text-srivalli-pink/70' : 'text-srivalli-purple/70'}`}>{formatTime(cls.time)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{cls.course?.title || cls.title}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span>{cls.teacher?.name || 'Teacher'}</span>
                          {cls._studentName && <span>· {cls._studentName}</span>}
                        </div>
                      </div>
                      {today && <Badge className="bg-green-100 text-green-700 text-[9px] flex-shrink-0">Today</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Card */}
      {latestPayment && (
        <Card className="fun-shadow border-0 overflow-hidden">
          <div className="gradient-teal p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-bold text-sm">Payment Status</span>
            </div>
            <Badge className="bg-white/20 text-white text-xs">Active Plan</Badge>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Latest Active Plan</p>
                <p className="text-sm font-bold">{latestPayment.enrollment.course?.title || 'Course'}</p>
                <p className="text-xs text-muted-foreground">for {latestPayment.enrollment.student?.name || 'Child'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-extrabold text-srivalli-teal">{formatCurrency(latestPayment.amount)}</p>
                <p className="text-xs text-muted-foreground">{latestPayment.plan} plan</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Paid on {formatDate(latestPayment.createdAt)}</span>
              <Button size="sm" variant="outline" className="rounded-xl text-xs border-srivalli-teal/30 text-srivalli-teal" onClick={() => nav('PARENT_PAYMENTS')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ================================================
   3. PARENT CHILDREN (Detailed Progress)
   ================================================ */

export function ParentChildren() {
  const user = useAppStore(s => s.user);
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [childAttendance, setChildAttendance] = useState<Record<string, AttendanceStats>>({});
  const [childEnrollments, setChildEnrollments] = useState<Record<string, EnrollmentItem[]>>({});
  const [childClasses, setChildClasses] = useState<Record<string, ClassItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childCerts, setChildCerts] = useState<Record<string, CertificateItem[]>>({});

  const parentId = user?.id || '';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/parents?id=${parentId}`);
        const d = await res.json();
        if (!d.success || cancelled) { if (!cancelled) setLoading(false); return; }
        const students = (d.students || []) as StudentChild[];
        setChildren(students);

        const [attendResults, enrollResults, classResults] = await Promise.allSettled([
          Promise.all(students.map(s => fetchWithAuth(`/api/attendance?studentId=${s.id}`).then(r => r.json()))),
          Promise.all(students.map(s => fetchWithAuth(`/api/enrollments?studentId=${s.id}`).then(r => r.json()))),
          Promise.all(students.map(s => fetchWithAuth(`/api/classes?studentId=${s.id}`).then(r => r.json()))),
        ]);
        if (cancelled) return;

        const aMap: Record<string, AttendanceStats> = {};
        const eMap: Record<string, EnrollmentItem[]> = {};
        const cMap: Record<string, ClassItem[]> = {};

        if (attendResults.status === 'fulfilled') {
          attendResults.value.forEach((ar, idx) => {
            if (ar.success && ar.stats) aMap[students[idx].id] = ar.stats;
          });
        }
        if (enrollResults.status === 'fulfilled') {
          enrollResults.value.forEach((er, idx) => {
            if (er.success) eMap[students[idx].id] = er.enrollments || [];
          });
        }
        if (classResults.status === 'fulfilled') {
          classResults.value.forEach((cr, idx) => {
            if (cr.success) cMap[students[idx].id] = cr.classes || [];
          });
        }

        setChildAttendance(aMap);
        setChildEnrollments(eMap);
        setChildClasses(cMap);

        // Certificates
        const certResults = await Promise.allSettled(
          students.map(s => fetchWithAuth(`/api/certificates?studentId=${s.id}`).then(r => r.json()))
        );
        if (cancelled) return;
        const certMap: Record<string, CertificateItem[]> = {};
        if (certResults.status === 'fulfilled') {
          certResults.value.forEach((cr, idx) => {
            if (cr.success) certMap[students[idx].id] = cr.certificates || [];
          });
        }
        setChildCerts(certMap);
      } catch { /* graceful */ } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [parentId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const viewChild = selectedChild ? children.find(c => c.id === selectedChild) : null;

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">My Children 👨‍👧‍👦</h2>
        <p className="text-sm text-muted-foreground">Detailed progress overview for each child</p>
      </div>

      {children.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8 text-srivalli-pink" />} title="No Children Linked" description="Contact the school to link your children." />
      ) : selectedChild && viewChild ? (
        <>
          <button onClick={() => setSelectedChild(null)} className="flex items-center gap-1 text-sm text-srivalli-purple font-medium hover:underline">
            <ChevronLeft className="w-4 h-4" /> Back to all children
          </button>
          {renderChildDetail(viewChild, childAttendance[viewChild.id], childEnrollments[viewChild.id] || [], childClasses[viewChild.id] || [], childCerts[viewChild.id] || [])}
        </>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((child, idx) => {
            const cc = getChildColor(idx);
            const att = childAttendance[child.id];
            const enrolls = childEnrollments[child.id] || [];
            const activeEnrolls = enrolls.filter(e => e.status === 'active');
            const completedClasses = (childClasses[child.id] || []).filter(c => c.status === 'completed').length;
            const totalClasses = (childClasses[child.id] || []).length;
            const progressPct = totalClasses > 0 ? Math.round((completedClasses / Math.max(totalClasses, 1)) * 100) : 0;
            return (
              <Card key={child.id} className="card-hover fun-shadow border-0 overflow-hidden cursor-pointer" onClick={() => setSelectedChild(child.id)}>
                <div className={`${cc.bg} p-4 flex items-center gap-3`}>
                  <Avatar className={`h-14 w-14 ring-2 ${cc.ring}`}>
                    <AvatarFallback className={`${cc.bg} ${cc.text} font-bold text-base`}>
                      {getInitials(child.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {child.grade ? `Grade ${child.grade}` : ''} {child.age ? `· ${child.age} yrs` : ''} {child.schoolName ? `· ${child.schoolName}` : ''}
                    </p>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${cc.text}`} />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-srivalli-light-pink/30">
                      <p className="text-lg font-extrabold text-srivalli-pink">{activeEnrolls.length}</p>
                      <p className="text-[10px] text-muted-foreground">Courses</p>
                    </div>
                    <div className="p-2 rounded-xl bg-srivalli-light-teal/30">
                      <p className="text-lg font-extrabold text-srivalli-teal">{att?.percentage || 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Attendance</p>
                    </div>
                    <div className="p-2 rounded-xl bg-srivalli-light-orange/30">
                      <p className="text-lg font-extrabold text-srivalli-orange">{child.points}</p>
                      <p className="text-[10px] text-muted-foreground">Points</p>
                    </div>
                  </div>
                  {att && <AttendanceBar percentage={att.percentage} />}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-bold text-srivalli-purple">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Last active</p>
                    <p className="text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Today</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderChildDetail(
  child: StudentChild,
  att: AttendanceStats | undefined,
  enrollments: EnrollmentItem[],
  classes: ClassItem[],
  certs: CertificateItem[],
  assignments: any[] = []
) {
  const activeEnrolls = enrollments.filter(e => e.status === 'active');
  const completedClasses = classes.filter(c => c.status === 'completed').length;
  const totalClasses = classes.length;
  const progressPct = totalClasses > 0 ? Math.round((completedClasses / Math.max(totalClasses, 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Child Header */}
      <Card className="fun-shadow border-0 overflow-hidden">
        <div className="gradient-warm p-5 text-white flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-white/30">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{getInitials(child.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{child.name}</h3>
            <p className="text-white text-sm">
              {child.grade ? `Grade ${child.grade}` : 'No grade'} {child.age ? `· ${child.age} years` : ''} {child.schoolName ? `· ${child.schoolName}` : ''}
            </p>
          </div>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-srivalli-light-pink/30">
              <p className="text-2xl font-extrabold text-srivalli-pink">{activeEnrolls.length}</p>
              <p className="text-xs text-muted-foreground">Active Courses</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-srivalli-light-teal/30">
              <p className="text-2xl font-extrabold text-srivalli-teal">{att?.percentage || 0}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-srivalli-light-orange/30">
              <p className="text-2xl font-extrabold text-srivalli-orange">{child.points}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-srivalli-light-purple/30">
              <p className="text-2xl font-extrabold text-srivalli-purple">{progressPct}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </div>

          {att && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-srivalli-light-teal/20">
                <p className="text-lg font-bold text-srivalli-green">{att.present}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-50">
                <p className="text-lg font-bold text-red-500">{att.absent}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-srivalli-light-purple/20">
                <p className="text-lg font-bold text-srivalli-purple">{att.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Courses */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-srivalli-pink" /> Enrolled Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No enrollments yet.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-srivalli-light-pink/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-srivalli-pink/10 flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-srivalli-pink" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{e.course?.title || 'Course'}</p>
                      <p className="text-[10px] text-muted-foreground">{e.plan} · Since {formatDate(e.startDate)}</p>
                    </div>
                  </div>
                  <Badge className={e.status === 'active' ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-gray-100 text-gray-500 text-[10px]'}>
                    {e.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Feedback (Actual) */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-srivalli-purple" /> Teacher Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {assignments.filter(a => a.submission && a.submission.feedback).length > 0 ? (
              assignments.filter(a => a.submission && a.submission.feedback).map((assignment, index) => (
                <div key={assignment.id} className={`p-3 rounded-xl border-l-4 ${index % 2 === 0 ? 'bg-srivalli-light-purple/20 border-srivalli-purple' : 'bg-srivalli-light-teal/20 border-srivalli-teal'}`}>
                  <p className={`text-xs font-semibold ${index % 2 === 0 ? 'text-srivalli-purple' : 'text-srivalli-teal'}`}>
                    {activeEnrolls.find(e => e.courseId === assignment.courseId)?.course?.title || 'Assignment'} · {assignment.title}
                  </p>
                  <p className="text-sm text-foreground mt-1">&quot;{assignment.submission.feedback}&quot;</p>
                  {assignment.submission.marks && <p className="text-[10px] text-muted-foreground mt-1">Marks: {assignment.submission.marks}/{assignment.maxMarks || 50}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No feedback available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      {certs.length > 0 && (
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-srivalli-orange" /> Certificates ({certs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-2 gap-3">
            {certs.map(cert => (
              <div key={cert.id} className="p-3 rounded-xl bg-srivalli-light-orange/20 text-center">
                <Award className="w-6 h-6 text-srivalli-orange mx-auto mb-1" />
                <p className="text-xs font-bold truncate">{cert.course?.title || 'Certificate'}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(cert.issuedAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ================================================
   4. PARENT CLASSES
   ================================================ */

export function ParentClasses() {
  const user = useAppStore(s => s.user);
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [childClasses, setChildClasses] = useState<Record<string, ClassItem[]>>({});
  const [childAttendance, setChildAttendance] = useState<Record<string, AttendanceStats>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [childAttendMap, setChildAttendMap] = useState<Record<string, Record<string, boolean>>>({});

  const parentId = user?.id || '';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/parents?id=${parentId}`);
        const d = await res.json();
        if (!d.success || cancelled) { if (!cancelled) setLoading(false); return; }
        const students = (d.students || []) as StudentChild[];
        setChildren(students);
        if (students.length > 0) setActiveTab(students[0].id);

        const [classResults, attendResults] = await Promise.allSettled([
          Promise.all(students.map(s => fetchWithAuth(`/api/classes?studentId=${s.id}`).then(r => r.json()))),
          Promise.all(students.map(s => fetchWithAuth(`/api/attendance?studentId=${s.id}`).then(r => r.json()))),
        ]);
        if (cancelled) return;

        const cMap: Record<string, ClassItem[]> = {};
        const aMap: Record<string, AttendanceStats> = {};
        const aaMap: Record<string, Record<string, boolean>> = {};

        if (classResults.status === 'fulfilled') {
          classResults.value.forEach((cr, idx) => {
            if (cr.success) cMap[students[idx].id] = cr.classes || [];
          });
        }
        if (attendResults.status === 'fulfilled') {
          attendResults.value.forEach((ar, idx) => {
            if (ar.success) {
              aMap[students[idx].id] = ar.stats;
              const am: Record<string, boolean> = {};
              (ar.attendance || []).forEach((a: { classId: string; present: boolean }) => { am[a.classId] = a.present; });
              aaMap[students[idx].id] = am;
            }
          });
        }
        setChildClasses(cMap);
        setChildAttendance(aMap);
        setChildAttendMap(aaMap);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [parentId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (children.length === 0) {
    return <EmptyState icon={<Video className="w-8 h-8 text-srivalli-pink" />} title="No Children" description="Link your children to view their classes." />;
  }

  const currentClasses = childClasses[activeTab] || [];
  const upcoming = currentClasses.filter(c => isFuture(c.date) || isToday(c.date)).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = currentClasses.filter(c => isPast(c.date)).sort((a, b) => b.date.localeCompare(a.date));
  const att = childAttendance[activeTab];
  const attendMap = childAttendMap[activeTab] || {};

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Classes 📅</h2>
        <p className="text-sm text-muted-foreground">View class schedules for your children</p>
      </div>

      {children.length > 1 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-srivalli-light-pink/30 h-auto flex-wrap">
            {children.map((child, idx) => {
              const cc = getChildColor(idx);
              return (
                <TabsTrigger
                  key={child.id}
                  value={child.id}
                  className={`data-[state=active]:${cc.bg} data-[state=active]:${cc.text} rounded-xl text-xs font-medium px-4 py-2`}
                >
                  {child.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {/* Attendance Summary */}
      {att && (
        <Card className="fun-shadow border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-srivalli-teal" /> Attendance Summary
              </p>
              <span className={`text-sm font-extrabold ${att.percentage >= 80 ? 'text-srivalli-green' : att.percentage >= 60 ? 'text-srivalli-orange' : 'text-red-500'}`}>
                {att.percentage}%
              </span>
            </div>
            <AttendanceBar percentage={att.percentage} />
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-2 rounded-xl bg-srivalli-light-teal/30">
                <p className="text-lg font-bold text-srivalli-green">{att.present}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-red-50">
                <p className="text-lg font-bold text-red-500">{att.absent}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-srivalli-light-purple/30">
                <p className="text-lg font-bold text-srivalli-purple">{att.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-srivalli-purple" /> Upcoming Classes
          <Badge className="bg-srivalli-purple/10 text-srivalli-purple text-xs">{upcoming.length}</Badge>
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {upcoming.map(cls => {
              const today = isToday(cls.date);
              return (
                <Card key={cls.id} className={"card-hover border-0 " + (today ? "ring-2 ring-srivalli-pink/30 bg-srivalli-light-pink/10" : "")}>
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className={"flex-shrink-0 p-3 rounded-xl text-center min-w-[72px] " + (today ? "bg-srivalli-pink/10" : "bg-srivalli-light-purple/30")}>
                        <p className={"text-xs font-bold " + (today ? "text-srivalli-pink" : "text-srivalli-purple")}>
                          {new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className={"text-lg font-extrabold " + (today ? "text-srivalli-pink" : "text-srivalli-purple")}>{formatTime(cls.time)}</p>
                        {today && <Badge className="bg-green-100 text-green-700 text-[9px] mt-1">Today</Badge>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{cls.course?.title || cls.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> {cls.teacher?.name || 'Teacher'}</span>
                          {cls.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.duration}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Classes with Attendance */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" /> Past Classes
            <Badge className="bg-gray-100 text-gray-600 text-xs">{past.length}</Badge>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {past.map(cls => {
              const wasPresent = attendMap[cls.id] ?? null;
              return (
                <Card key={cls.id} className="border-0 hover:bg-gray-50/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-2 rounded-xl bg-gray-100 text-center min-w-[60px]">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground">{formatTime(cls.time)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cls.course?.title || cls.title}</p>
                        <p className="text-[10px] text-muted-foreground">{cls.teacher?.name || 'Teacher'}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {wasPresent === true ? (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Present
                          </Badge>
                        ) : wasPresent === false ? (
                          <Badge className="bg-red-100 text-red-600 text-[10px]">
                            <X className="w-3 h-3 mr-0.5" /> Absent
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 text-[10px]">
                            <Circle className="w-3 h-3 mr-0.5" /> N/A
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================
   5. PARENT PAYMENTS
   ================================================ */

export function ParentPayments() {
  const user = useAppStore(s => s.user);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [summary, setSummary] = useState({ totalPaid: 0, totalPending: 0, paymentCount: 0 });
  const [loading, setLoading] = useState(true);

  const parentId = user?.id || '';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [payRes, parentRes] = await Promise.allSettled([
          fetchWithAuth(`/api/payments?parentId=${parentId}`).then(r => r.json()),
          fetchWithAuth(`/api/parents?id=${parentId}`).then(r => r.json()),
        ]);
        if (cancelled) return;

        if (payRes.status === 'fulfilled' && payRes.value.success) {
          setPayments((payRes.value.payments || []) as PaymentItem[]);
          setSummary(payRes.value.summary || { totalPaid: 0, totalPending: 0, paymentCount: 0 });
        }
        if (parentRes.status === 'fulfilled' && parentRes.value.success) {
          setChildren((parentRes.value.students || []) as StudentChild[]);
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [parentId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const activePayments = payments.filter(p => p.enrollment?.status === 'active' && p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPayments = payments.filter(p => p.status === 'completed');
  const methods = [...new Set(payments.filter(p => p.method).map(p => p.method as string))];

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-xl font-bold text-foreground">Payments 💳</h2>
        <p className="text-sm text-muted-foreground">Manage your children&apos;s course payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-hover border-0 text-center p-4">
          <div className="p-2 bg-srivalli-light-green/30 rounded-xl w-fit mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5 text-srivalli-green" />
          </div>
          <p className="text-lg font-extrabold text-srivalli-green">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-[10px] text-muted-foreground">Total Paid</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <div className="p-2 bg-srivalli-light-orange/30 rounded-xl w-fit mx-auto mb-2">
            <Clock className="w-5 h-5 text-srivalli-orange" />
          </div>
          <p className="text-lg font-extrabold text-srivalli-orange">{formatCurrency(summary.totalPending)}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <div className="p-2 bg-srivalli-light-purple/30 rounded-xl w-fit mx-auto mb-2">
            <Receipt className="w-5 h-5 text-srivalli-purple" />
          </div>
          <p className="text-lg font-extrabold text-srivalli-purple">{summary.paymentCount}</p>
          <p className="text-[10px] text-muted-foreground">Transactions</p>
        </Card>
      </div>

      {/* Active Plan Details */}
      {activePayments.length > 0 && (
        <Card className="fun-shadow border-0 overflow-hidden">
          <div className="gradient-teal p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-sm">Active Enrollment Plans</span>
              </div>
              <Badge className="bg-white/20 text-white text-xs">{activePayments.length} active</Badge>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            {activePayments.map(p => {
              const renewalDate = p.enrollment.endDate ? formatDate(p.enrollment.endDate) : 'N/A';
              return (
                <div key={p.id} className="p-3 rounded-xl bg-srivalli-light-teal/20 border border-srivalli-teal/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold">{p.enrollment.course?.title || 'Course'}</p>
                      <p className="text-xs text-muted-foreground">For {p.enrollment.student?.name || 'Child'} · {p.plan} plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-srivalli-teal">{formatCurrency(p.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">Paid on {formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Renews: {renewalDate}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-teal text-white rounded-xl text-xs" onClick={() => {
                        addToast('Redirecting to checkout...', 'info');
                        setTimeout(() => window.location.href = '/checkout?courseId=' + p.enrollment.courseId, 1000);
                      }}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Renew Now
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs border-srivalli-teal/30 text-srivalli-teal" onClick={() => addToast('Upgrade options coming soon!', 'info')}>
                        <ArrowUpRight className="w-3 h-3 mr-1" /> Upgrade
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Used */}
      {methods.length > 0 && (
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-srivalli-pink" /> Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {methods.map(m => (
                <Badge key={m} variant="outline" className="px-3 py-1.5 rounded-xl text-xs font-medium">
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> {m}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-srivalli-orange">
              <AlertCircle className="w-5 h-5" /> Pending Payments
              <Badge className="bg-srivalli-light-orange text-srivalli-orange text-[10px]">{pendingPayments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {pendingPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-srivalli-light-orange/20">
                <div>
                  <p className="text-sm font-semibold">{p.enrollment.course?.title || 'Course'}</p>
                  <p className="text-xs text-muted-foreground">For {p.enrollment.student?.name || 'Child'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-srivalli-orange">{formatCurrency(p.amount)}</p>
                  <Button size="sm" className="gradient-warm text-white rounded-xl text-xs mt-1" onClick={() => {
                    addToast('Redirecting to checkout...', 'info');
                    setTimeout(() => window.location.href = '/checkout?paymentId=' + p.id, 1000);
                  }}>
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="fun-shadow border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-srivalli-purple" /> Payment History
          </CardTitle>
          <CardDescription>{completedPayments.length} completed transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payment records yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {payments.map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl hover:bg-srivalli-light-pink/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={"p-2 rounded-xl flex-shrink-0 " + (p.status === 'completed' ? 'bg-srivalli-light-green/30' : 'bg-srivalli-light-orange/30')}>
                      {p.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-srivalli-green" /> : <Clock className="w-4 h-4 text-srivalli-orange" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{p.enrollment.course?.title || 'Course'}</p>
                      <p className="text-[10px] text-muted-foreground">{p.enrollment.student?.name || ''} · {p.plan} · {formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className={"text-sm font-bold " + (p.status === 'completed' ? 'text-srivalli-green' : 'text-srivalli-orange')}>{formatCurrency(p.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{p.method || 'Online'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`<html><head><title>Invoice - ${p.id}</title></head><body style="padding: 50px; font-family: sans-serif;"><h1>Invoice</h1><p>Date: ${new Date(p.createdAt).toLocaleDateString()}</p><p>Amount: Rs. ${p.amount}</p><p>Status: ${p.status}</p><script>window.print();</script></body></html>`);
                          printWindow.document.close();
                        }
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================
   6. PARENT CERTIFICATES
   ================================================ */

export function ParentCertificates() {
  const user = useAppStore(s => s.user);
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [childCerts, setChildCerts] = useState<Record<string, CertificateItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewingCert, setViewingCert] = useState<CertificateItem & { _studentName?: string } | null>(null);

  const parentId = user?.id || '';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/parents?id=${parentId}`);
        const d = await res.json();
        if (!d.success || cancelled) { if (!cancelled) setLoading(false); return; }
        const students = (d.students || []) as StudentChild[];
        setChildren(students);

        const certResults = await Promise.allSettled(
          students.map(s => fetchWithAuth(`/api/certificates?studentId=${s.id}`).then(r => r.json()))
        );
        if (cancelled) return;
        const cMap: Record<string, CertificateItem[]> = {};
        if (certResults.status === 'fulfilled') {
          certResults.value.forEach((cr, idx) => {
            if (cr.success) {
              cMap[students[idx].id] = (cr.certificates || []).map((c: CertificateItem) => ({ ...c, _studentId: students[idx].id, _studentName: students[idx].name }));
            }
          });
        }
        setChildCerts(cMap);
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [parentId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    );
  }

  const totalCerts = Object.values(childCerts).reduce((sum, c) => sum + c.length, 0);

  return (
    <div className="space-y-6 bounce-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Certificates 🎓</h2>
          <p className="text-sm text-muted-foreground">Your children&apos;s achievements and certificates</p>
        </div>
        {totalCerts > 0 && (
          <Badge className="bg-srivalli-light-orange text-srivalli-orange px-3 py-1 text-sm">{totalCerts} total</Badge>
        )}
      </div>

      {/* View Certificate Dialog */}
      <Dialog open={!!viewingCert} onOpenChange={(open) => { if (!open) setViewingCert(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-srivalli-pink" /> Certificate
            </DialogTitle>
            <DialogDescription>Certificate of Completion</DialogDescription>
          </DialogHeader>
          {viewingCert && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-srivalli-pink/30 rounded-xl p-6 text-center bg-srivalli-light-pink/10 space-y-3">
                <span className="text-4xl">🎓</span>
                <h3 className="font-bold text-lg">{viewingCert.course?.title || 'Course'}</h3>
                <p className="text-sm text-muted-foreground">
                  This certifies that <strong className="text-srivalli-pink">{viewingCert._studentName || 'Student'}</strong> has successfully completed the course.
                </p>
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Date: {formatDate(viewingCert.issuedAt)}</span>
                  <span>ID: {viewingCert.certificateCode}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl gradient-pink text-white" onClick={() => addToast('Certificate downloaded! 📥')}>
                  <Download className="w-4 h-4 mr-1.5" /> Download
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl border-srivalli-purple/30 text-srivalli-purple" onClick={() => addToast('Share link copied! 🔗')}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {children.length === 0 ? (
        <EmptyState icon={<Award className="w-8 h-8 text-srivalli-pink" />} title="No Children" description="Link your children to view their certificates." />
      ) : totalCerts === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8 text-srivalli-pink" />}
          title="No Certificates Yet"
          description="Your children will earn certificates as they complete courses."
        />
      ) : (
        children.map((child, idx) => {
          const certs = childCerts[child.id] || [];
          if (certs.length === 0) return null;
          const cc = getChildColor(idx);
          return (
            <div key={child.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className={`h-7 w-7 ring-1 ${cc.ring}`}>
                  <AvatarFallback className={`${cc.bg} ${cc.text} font-bold text-[10px]`}>
                    {getInitials(child.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-base font-bold">{child.name}</h3>
                <Badge variant="secondary" className="text-[10px]">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {certs.map(cert => (
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
                        {cert.issuedBy && <span>by {cert.issuedBy.name}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => setViewingCert(cert as CertificateItem & { _studentName?: string })}>
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => addToast('Certificate downloaded! 📥')}>
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ================================================
   7. PARENT PROFILE
   ================================================ */

export function ParentProfile() {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', city: '', state: '' });
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [childAttendance, setChildAttendance] = useState<Record<string, AttendanceStats>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) { if (!cancelled) setLoading(false); return; }

      setFormData({
        name: user.name || '',
        mobile: (user as Record<string, unknown>).mobile as string || '',
        email: user.email || '',
        city: (user as Record<string, unknown>).city as string || '',
        state: (user as Record<string, unknown>).state as string || '',
      });

      try {
        const res = await fetchWithAuth(`/api/parents?id=${user.id}`);
        const d = await res.json();
        if (cancelled) return;
        if (d.success) {
          const students = (d.students || []) as StudentChild[];
          setChildren(students);

          const attendResults = await Promise.allSettled(
            students.map(s => fetchWithAuth(`/api/attendance?studentId=${s.id}`).then(r => r.json()))
          );
          if (cancelled) return;
          const aMap: Record<string, AttendanceStats> = {};
          if (attendResults.status === 'fulfilled') {
            attendResults.value.forEach((ar, idx) => {
              if (ar.success && ar.stats) aMap[students[idx].id] = ar.stats;
            });
          }
          setChildAttendance(aMap);
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetchWithAuth('/api/parents', {
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

  const profileFields = [
    { icon: <UserCircle className="w-4 h-4" />, label: 'Name', value: formData.name, key: 'name' as const },
    { icon: <Phone className="w-4 h-4" />, label: 'Mobile', value: formData.mobile, key: 'mobile' as const },
    { icon: <Mail className="w-4 h-4" />, label: 'Email', value: formData.email, key: 'email' as const },
    { icon: <MapPin className="w-4 h-4" />, label: 'City', value: formData.city, key: 'city' as const },
    { icon: <MapPin className="w-4 h-4" />, label: 'State', value: formData.state, key: 'state' as const },
  ];

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
              {user?.name ? getInitials(user.name) : 'P'}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold">{user?.name || 'Parent'}</h3>
          <p className="text-white text-sm">{(user as Record<string, unknown>).mobile as string || user?.email || ''}</p>
          <Badge className="mt-2 bg-black/30 text-white border-white/50 text-xs">🏠 Parent</Badge>
        </div>
        <CardContent className="p-5 space-y-4">
          {editMode ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {profileFields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  <Input
                    value={formData[field.key]}
                    onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex gap-2">
                <Button className="flex-1 rounded-xl gradient-pink text-white" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditMode(false)} disabled={isSaving}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {profileFields.map(field => (
                  <div key={field.label} className="flex items-center gap-2 text-sm p-2 rounded-xl bg-srivalli-light-pink/20">
                    <span className="text-srivalli-pink">{field.icon}</span>
                    <span className="text-muted-foreground">{field.label}:</span>
                    <span className="font-medium ml-auto">{field.value || '-'}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl border-srivalli-pink/30 text-srivalli-pink" onClick={() => setEditMode(true)}>
                <Edit3 className="w-4 h-4 mr-1.5" /> Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children Quick Links */}
      {children.length > 0 && (
        <Card className="fun-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-srivalli-purple" /> My Children
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {children.map((child, idx) => {
              const cc = getChildColor(idx);
              const att = childAttendance[child.id];
              return (
                <div key={child.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-srivalli-light-pink/20 transition-colors cursor-pointer" onClick={() => nav('PARENT_CHILDREN')}>
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-9 w-9 ring-1 ${cc.ring}`}>
                      <AvatarFallback className={`${cc.bg} ${cc.text} font-bold text-xs`}>
                        {getInitials(child.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{child.name}</p>
                      <p className="text-[10px] text-muted-foreground">{child.grade ? `Grade ${child.grade}` : ''} {att ? `· ${att.percentage}% attend.` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] text-srivalli-orange">
                      <Star className="w-3 h-3 mr-0.5" /> {child.points} pts
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-hover border-0 text-center p-4">
          <Users className="w-6 h-6 text-srivalli-pink mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-pink">{children.length}</p>
          <p className="text-xs text-muted-foreground">Children</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <CreditCard className="w-6 h-6 text-srivalli-teal mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-teal">{(user as Record<string, unknown>).city as string || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">City</p>
        </Card>
        <Card className="card-hover border-0 text-center p-4">
          <Shield className="w-6 h-6 text-srivalli-purple mx-auto mb-1" />
          <p className="text-xl font-extrabold text-srivalli-purple">Active</p>
          <p className="text-xs text-muted-foreground">Status</p>
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

