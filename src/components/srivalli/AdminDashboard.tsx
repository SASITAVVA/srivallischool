'use client';

import React, { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, BookOpen,
  CreditCard, CalendarCheck, BarChart3, Settings, LogOut, Award, Link as LinkIcon,
  Menu, X, Bell, ChevronRight, ChevronDown, ChevronUp,
  Plus, Search, Eye, Trash2, Edit3, Phone, MessageCircle,
  TrendingUp, TrendingDown, DollarSign, UserCircle,
  School, CheckCircle2, Clock, AlertCircle, Download,
  Save, Loader2, Star, ArrowRight, ArrowUpRight,
  Mail, MapPin, Hash, Activity, Calendar, Filter,
  PhoneCall, Check, ExternalLink, FileText,
  UsersRound, Baby, IndianRupee, Wallet, Receipt,
  PieChart, LineChart, UserPlus, BookMarked,
  CircleDot, Wifi, Shield, Info, Sliders, Zap, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useAppStore, type Screen } from '@/lib/store';
import { auth } from '@/lib/firebase';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const nav = (s: Screen) => useAppStore.getState().navigate(s);
const addToast = (msg: string, type?: 'success' | 'error' | 'info') =>
  useAppStore.getState().addToast(msg, type);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (name: string) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

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

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const fetchApi = async (url: string, init?: RequestInit) => {
  let token = useAppStore.getState().idToken;
  
  // Attempt to get a fresh token if Firebase auth is initialized
  // This solves the "Missing or invalid Authorization header" error when tokens expire
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      useAppStore.getState().setIdToken(token);
    } catch (e) {
      console.warn('Failed to refresh token', e);
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // ignore json parse error
  }
  
  if (!res.ok || !data.success) {
    // We throw the error so the calling component can display it in a toast
    throw new Error(data.message || 'API Error');
  }
  return data;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface NavItem {
  label: string;
  icon: ReactNode;
  screen: Screen;
}

interface StatCardData {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN LAYOUT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const sidebarNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, screen: 'ADMIN_DASHBOARD' },
  { label: 'Students', icon: <GraduationCap size={20} />, screen: 'ADMIN_STUDENTS' },
  { label: 'Parents', icon: <Users size={20} />, screen: 'ADMIN_PARENTS' },
  { label: 'Teachers', icon: <UserCheck size={20} />, screen: 'ADMIN_TEACHERS' },
  { label: 'Courses', icon: <BookOpen size={20} />, screen: 'ADMIN_COURSES' },
  { label: 'Payments', icon: <CreditCard size={20} />, screen: 'ADMIN_PAYMENTS' },
  { label: 'Demo Requests', icon: <CalendarCheck size={20} />, screen: 'ADMIN_DEMO_REQUESTS' },
  { label: 'Reports', icon: <BarChart3 size={20} />, screen: 'ADMIN_REPORTS' },
  { label: 'Settings', icon: <Settings size={20} />, screen: 'ADMIN_SETTINGS' },
  { label: 'Teacher Assignments', icon: <UserCheck size={20} />, screen: 'ADMIN_TEACHER_ASSIGNMENTS' },
  { label: 'Certificates', icon: <Award size={20} />, screen: 'ADMIN_CERTIFICATES' as Screen },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, screen, logout, sidebarOpen, setSidebarOpen } = useAppStore();

  const isActive = (s: Screen) => screen === s;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-srivalli-light-pink/60 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
                <School size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gradient hidden sm:block">Srivalli</span>
              <span className="text-xs text-muted-foreground hidden md:block">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-srivalli-pink rounded-full" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-srivalli-light-pink text-srivalli-pink text-xs font-bold">
                  {user?.name ? getInitials(user.name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{user?.name || 'Admin'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-srivalli-light-pink/60 bg-white flex-col">
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {sidebarNavItems.map((item) => (
                <button
                  key={item.screen}
                  onClick={() => nav(item.screen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.screen)
                      ? 'gradient-pink text-white shadow-md'
                      : 'text-gray-600 hover:bg-srivalli-light-pink/60 hover:text-srivalli-pink'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive(item.screen) && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </ScrollArea>
          <div className="border-t border-srivalli-light-pink/60 p-3">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col z-50">
              <div className="flex items-center justify-between h-14 px-4 border-b border-srivalli-light-pink/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
                    <School size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-gradient">Srivalli</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </Button>
              </div>
              <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-3">
                  {sidebarNavItems.map((item) => (
                    <button
                      key={item.screen}
                      onClick={() => {
                        nav(item.screen);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive(item.screen)
                          ? 'gradient-pink text-white shadow-md'
                          : 'text-gray-600 hover:bg-srivalli-light-pink/60 hover:text-srivalli-pink'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </ScrollArea>
              <div className="border-t border-srivalli-light-pink/60 p-3">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-srivalli-light-pink/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {sidebarNavItems.slice(0, 5).map((item) => (
            <button
              key={item.screen}
              onClick={() => nav(item.screen)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] ${
                isActive(item.screen)
                  ? 'text-srivalli-pink'
                  : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-gray-400 min-w-[48px]"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN DASHBOARD MAIN
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminDashMain() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalParents: number;
    totalTeachers: number;
    activeCourses: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeEnrollments: number;
    pendingDemos: number;
  }>({
    totalStudents: 0, totalParents: 0, totalTeachers: 0,
    activeCourses: 0, totalRevenue: 0, monthlyRevenue: 0,
    activeEnrollments: 0, pendingDemos: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Array<Record<string, unknown>>>([]);
  const [revenueTrend, setRevenueTrend] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentsRes, parentsRes, teachersRes, coursesRes, revenueRes, demosRes] = await Promise.allSettled([
          fetchApi('/api/students'),
          fetchApi('/api/parents'),
          fetchApi('/api/teachers'),
          fetchApi('/api/courses'),
          fetchApi('/api/reports?type=revenue'),
          fetchApi('/api/demo-request'),
        ]);

        const students = studentsRes.status === 'fulfilled' ? (studentsRes.value.students || []) : [];
        const parents = parentsRes.status === 'fulfilled' ? (parentsRes.value.parents || []) : [];
        const teachers = teachersRes.status === 'fulfilled' ? (teachersRes.value.teachers || []) : [];
        const courses = coursesRes.status === 'fulfilled' ? (coursesRes.value.courses || []) : [];
        const revenue = revenueRes.status === 'fulfilled' ? revenueRes.value : { summary: { totalRevenue: 0 }, monthlyRevenue: {} };
        const demos = demosRes.status === 'fulfilled' ? (demosRes.value.demoRequests || []) : [];

        setStats({
          totalStudents: students.length,
          totalParents: parents.length,
          totalTeachers: teachers.length,
          activeCourses: courses.filter((c: Record<string, unknown>) => c.isActive).length,
          totalRevenue: revenue.summary?.totalRevenue || 0,
          monthlyRevenue: Object.values(revenue.monthlyRevenue || {}).slice(-1)[0] || 0,
          activeEnrollments: 0,
          pendingDemos: demos.filter((d: Record<string, unknown>) => d.status === 'New').length,
        });

        setRecentStudents(students.slice(0, 5));
        setRevenueTrend(revenue.monthlyRevenue || {});
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const statCards: StatCardData[] = [
    { label: 'Total Students', value: stats.totalStudents, icon: <GraduationCap size={22} />, color: 'text-srivalli-pink', bgColor: 'bg-srivalli-light-pink' },
    { label: 'Total Parents', value: stats.totalParents, icon: <Users size={22} />, color: 'text-srivalli-purple', bgColor: 'bg-srivalli-light-purple' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: <UserCheck size={22} />, color: 'text-srivalli-teal', bgColor: 'bg-srivalli-light-teal' },
    { label: 'Active Courses', value: stats.activeCourses, icon: <BookOpen size={22} />, color: 'text-srivalli-orange', bgColor: 'bg-srivalli-light-orange' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: <IndianRupee size={22} />, color: 'text-srivalli-green', bgColor: 'bg-srivalli-light-green' },
    { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue), icon: <Wallet size={22} />, color: 'text-srivalli-pink', bgColor: 'bg-srivalli-light-pink' },
    { label: 'Active Enrollments', value: stats.activeEnrollments, icon: <Activity size={22} />, color: 'text-srivalli-purple', bgColor: 'bg-srivalli-light-purple' },
    { label: 'Pending Demos', value: stats.pendingDemos, icon: <CalendarCheck size={22} />, color: 'text-srivalli-orange', bgColor: 'bg-srivalli-light-orange' },
  ];

  const maxRevenue = Math.max(...Object.values(revenueTrend), 1);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            {getGreeting()}, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening at Srivalli SmartSpeak today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => nav('ADMIN_DEMO_REQUESTS')} variant="outline" className="gap-2">
            <CalendarCheck size={16} />
            <span className="hidden sm:inline">Demo Requests</span>
          </Button>
          <Button onClick={() => nav('ADMIN_REPORTS')} className="gap-2 gradient-pink text-white shadow-md hover:shadow-lg">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">View Reports</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </Card>
            ))
          : statCards.map((card, i) => (
              <Card key={i} className="p-4 card-hover cursor-default">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{card.label}</p>
                    <p className="text-xl lg:text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${card.bgColor} flex items-center justify-center ${card.color} flex-shrink-0`}>
                    {card.icon}
                  </div>
                </div>
              </Card>
            ))
        }
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Registrations */}
        <Card className="fun-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UsersRound size={18} className="text-srivalli-pink" />
                Recent Registrations
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => nav('ADMIN_STUDENTS')}>
                View All <ArrowRight size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students registered yet</p>
            ) : (
              <div className="space-y-2">
                {recentStudents.map((s: Record<string, unknown>, i: number) => (
                  <div key={String(s.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-srivalli-light-pink/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-srivalli-light-pink flex items-center justify-center text-srivalli-pink text-xs font-bold flex-shrink-0">
                      {getInitials(String(s.name || ''))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{String(s.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">{String(s.grade || 'No grade')} • {String(s.schoolName || 'N/A')}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(String(s.createdAt || ''))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="fun-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-srivalli-green" />
                Revenue Trend
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => nav('ADMIN_PAYMENTS')}>
                Details <ArrowRight size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            ) : Object.keys(revenueTrend).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No revenue data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(revenueTrend).map(([month, amount]) => (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{month}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-teal transition-all duration-700"
                        style={{ width: `${Math.max((amount / maxRevenue) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="fun-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap size={18} className="text-srivalli-orange" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Student', icon: <GraduationCap size={20} />, screen: 'ADMIN_STUDENTS' as Screen, color: 'text-srivalli-pink', bg: 'bg-srivalli-light-pink' },
              { label: 'Add Teacher', icon: <UserPlus size={20} />, screen: 'ADMIN_TEACHERS' as Screen, color: 'text-srivalli-teal', bg: 'bg-srivalli-light-teal' },
              { label: 'Create Course', icon: <BookMarked size={20} />, screen: 'ADMIN_COURSES' as Screen, color: 'text-srivalli-purple', bg: 'bg-srivalli-light-purple' },
              { label: 'View Reports', icon: <PieChart size={20} />, screen: 'ADMIN_REPORTS' as Screen, color: 'text-srivalli-orange', bg: 'bg-srivalli-light-orange' },
            ].map((action, i) => (
              <Button
                key={i}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 px-3 hover:shadow-md transition-all"
                onClick={() => nav(action.screen)}
              >
                <div className={`h-10 w-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN STUDENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminStudents() {
  const [students, setStudents] = useState<Array<Record<string, unknown>>>([]);
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Record<string, unknown> | null>(null);
  const [studentDetail, setStudentDetail] = useState<{ student?: Record<string, unknown>; loading: boolean; error: string }>({ loading: false, error: '' });
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageAccessId, setManageAccessId] = useState<string | null>(null);
  const [deleteEnrollmentId, setDeleteEnrollmentId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        fetchApi('/api/students'),
        fetchApi('/api/courses')
      ]);
      setStudents(sData.students || []);
      setCourses(cData.courses || []);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  
  const toggleStudentActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetchApi('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      if (res.success) {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
        addToast('Student status updated', 'success');
      } else {
        addToast(res.message || 'Update failed', 'error');
      }
    } catch (e) {
      addToast('Error updating status', 'error');
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedStudent(students.find(s => s.id === id) || null);
    try {
      const data = await fetchApi(`/api/students?id=${id}`);
      setStudentDetail(data);
    } catch {
      addToast('Failed to load student details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const data = await fetchApi(`/api/students?id=${deleteId}`, { method: 'DELETE' });
      if (data && data.success) {
        addToast('Student deleted successfully');
        setStudents(prev => prev.filter(s => s.id !== deleteId));
        setDeleteId(null);
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete student', 'error');
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!deleteEnrollmentId) return;
    try {
      const data = await fetchApi(`/api/enrollments?id=${deleteEnrollmentId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Enrollment deleted successfully');
        if (studentDetail.student) {
          setStudentDetail(prev => ({
            ...prev,
            student: {
              ...prev.student!,
              enrollments: (prev.student!.enrollments as Array<Record<string, unknown>>).filter(e => e.id !== deleteEnrollmentId)
            }
          }));
        }
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete enrollment', 'error');
    } finally {
      setDeleteEnrollmentId(null);
    }
  };

  const grades = useMemo(() => {
    const g = new Set(students.map(s => String(s.grade)).filter(Boolean));
    return Array.from(g).sort();
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => String(s.name).toLowerCase().includes(q) || String(s.email).toLowerCase().includes(q) || String(s.schoolName).toLowerCase().includes(q));
    }
    if (gradeFilter !== 'all') {
      list = list.filter(s => String(s.grade) === gradeFilter);
    }
    return list;
  }, [students, search, gradeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <GraduationCap size={24} className="text-srivalli-pink" /> Students
          </h1>
          <p className="text-muted-foreground text-sm">{students.length} total students</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, school..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-4 w-full" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No students found</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s: Record<string, unknown>) => (
            <Card key={String(s.id)} className="p-4 card-hover cursor-pointer" onClick={() => loadDetail(String(s.id))}>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-srivalli-light-pink flex items-center justify-center text-srivalli-pink text-sm font-bold flex-shrink-0">
                  {getInitials(String(s.name))}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <p className="text-sm font-medium truncate">{String(s.name)}</p>
                    <p className="text-xs text-muted-foreground truncate">{String(s.email || 'No email')}</p>
                    {s.enrollmentId && <p className="text-[10px] text-srivalli-primary font-mono mt-0.5">{String(s.enrollmentId)}</p>}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={s.isActive !== false ? "success" : "destructive"} className="text-xs cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleStudentActive(String(s.id), s.isActive !== false); }}>
                      {s.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="hidden sm:block col-span-2">
                    <p className="text-xs text-muted-foreground">Assigned Courses</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(s.enrollments) && s.enrollments.filter((e: any) => e.status === 'active').length > 0 ? (
                        s.enrollments.filter((e: any) => e.status === 'active').map((e: any, i: number) => {
                           const c = courses.find(course => course.id === e.courseId);
                           return <Badge key={i} variant="outline" className="text-[10px]">{c ? c.title : e.courseId}</Badge>;
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">No active courses</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setManageAccessId(String(s.id)); }}>
                    <Shield className="h-3 w-3 mr-1" /> Access
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); loadDetail(String(s.id)); }}>
                    <Eye size={16} />
                  </Button>
                  <AlertDialog open={deleteId === String(s.id)} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteId(String(s.id)); }}>
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{String(s.name)}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-srivalli-light-pink flex items-center justify-center text-srivalli-pink text-xs font-bold">
                {selectedStudent ? getInitials(String(selectedStudent.name)) : ''}
              </div>
              {selectedStudent ? String(selectedStudent.name) : 'Student'} — Profile
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : studentDetail ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Enrollment ID', value: String(studentDetail.student?.enrollmentId || 'N/A') },
                      { label: 'Email', value: String(studentDetail.student?.email || '—') },
                    { label: 'Age', value: String(studentDetail.student?.age || '—') },
                    { label: 'Grade', value: String(studentDetail.student?.grade || '—') },
                    { label: 'School', value: String(studentDetail.student?.schoolName || '—') },
                    { label: 'Gender', value: String(studentDetail.student?.gender || '—') },
                    { label: 'Points', value: String(studentDetail.points || 0) },
                    { label: 'Pref. Days', value: String(studentDetail.student?.preferredClassDays || '—') },
                    { label: 'Pref. Time', value: String(studentDetail.student?.preferredClassTime || '—') },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
                {/* Parent */}
                {studentDetail.student?.parent && (
                  <div className="bg-srivalli-light-purple/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Parent</p>
                    <p className="text-sm font-medium">{String(studentDetail.student.parent.name)}</p>
                    <p className="text-xs text-muted-foreground">{String(studentDetail.student.parent.mobile || '')}</p>
                  </div>
                )}
                {/* Attendance Stats */}
                {studentDetail.attendanceStats && (
                  <div className="bg-srivalli-light-teal/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Attendance</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={Number(studentDetail.attendanceStats.percentage)} className="h-2" />
                      </div>
                      <span className="text-sm font-bold">{String(studentDetail.attendanceStats.percentage)}%</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Present: {String(studentDetail.attendanceStats.present)}</span>
                      <span>Absent: {String(studentDetail.attendanceStats.absent)}</span>
                      <span>Total: {String(studentDetail.attendanceStats.total)}</span>
                    </div>
                  </div>
                )}
                {/* Enrollments */}
                {studentDetail.student?.enrollments && (studentDetail.student.enrollments as Array<Record<string, unknown>>).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Enrollments</p>
                    <div className="space-y-2">
                      {(studentDetail.student.enrollments as Array<Record<string, unknown>>).map((e: Record<string, unknown>) => (
                        <div key={String(e.id)} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 px-3">
                          <span className="text-sm">{String((e.course as Record<string, unknown>)?.title || 'Unknown')}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={String(e.status) === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                              {String(e.status)}
                            </Badge>
                            <AlertDialog open={deleteEnrollmentId === String(e.id)} onOpenChange={(open) => !open && setDeleteEnrollmentId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => setDeleteEnrollmentId(String(e.id))}>
                                  <Trash2 size={12} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Enrollment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this enrollment? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteEnrollment} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Badges */}
                {studentDetail.student?.earnedBadges && (studentDetail.student.earnedBadges as Array<Record<string, unknown>>).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Badges ({(studentDetail.student.earnedBadges as unknown[]).length})</p>
                    <div className="flex flex-wrap gap-2">
                      {(studentDetail.student.earnedBadges as Array<Record<string, unknown>>).map((eb: Record<string, unknown>) => (
                        <Badge key={String(eb.id)} variant="outline" className="gap-1">
                          <Star size={12} className="text-yellow-500" />
                          {String((eb.badge as Record<string, unknown>)?.name || 'Badge')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No details available</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageAccessId} onOpenChange={(open) => !open && setManageAccessId(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Course Access</DialogTitle>
            <DialogDescription>Grant or revoke course access for this student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {courses.map(course => {
              const student = students.find(s => String(s.id) === manageAccessId);
              const enrollments = Array.isArray(student?.enrollments) ? student.enrollments : [];
              const activeEnrollment = enrollments.find((e: any) => e.courseId === course.id && e.status === 'active');
              const isGranted = !!activeEnrollment;
              
              return (
                <div key={String(course.id)} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{String(course.title)}</p>
                    <p className="text-xs text-muted-foreground">Access: {isGranted ? 'Granted' : 'Revoked'}</p>
                  </div>
                  <Button 
                    variant={isGranted ? "destructive" : "default"} 
                    size="sm"
                    onClick={async () => {
                      if (isGranted) {
                        // Revoke
                        await fetchApi('/api/enrollments', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: activeEnrollment.id, status: 'revoked' })
                        });
                      } else {
                        // Grant
                        await fetchApi('/api/enrollments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ studentId: manageAccessId, courseId: course.id, plan: 'Manual' })
                        });
                      }
                      // Refresh data
                      loadStudents();
                    }}
                  >
                    {isGranted ? 'Revoke Access' : 'Grant Access'}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN PARENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminParents() {
  const [parents, setParents] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [parentPayments, setParentPayments] = useState<Record<string, unknown>>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const loadParents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/parents');
      setParents(data.parents || []);
    } catch {
      addToast('Failed to load parents', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadParents(); }, [loadParents]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setParentPayments(null);
      return;
    }
    setExpandedId(id);
    setPaymentsLoading(true);
    try {
      const data = await fetchApi(`/api/payments?parentId=${id}`);
      setParentPayments(data);
    } catch {
      setParentPayments(null);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null);

  const handleDeleteParent = async () => {
    if (!deleteParentId) return;
    try {
      const data = await fetchApi(`/api/parents?id=${deleteParentId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Parent deleted successfully');
        setParents(prev => prev.filter(p => p.id !== deleteParentId));
        setExpandedId(null);
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete parent', 'error');
    } finally {
      setDeleteParentId(null);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      const data = await fetchApi(`/api/payments?id=${deletePaymentId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Payment deleted successfully');
        if (parentPayments) {
          setParentPayments(prev => ({
            ...prev,
            payments: (prev.payments as Array<Record<string, unknown>>).filter(p => p.id !== deletePaymentId),
            summary: {
              ...(prev.summary as Record<string, unknown>),
              totalPaid: (prev.summary as Record<string, unknown>).totalPaid as number - (prev.payments as Array<Record<string, unknown>>).find(p => p.id === deletePaymentId)?.amount as number
            }
          }));
        }
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete payment', 'error');
    } finally {
      setDeletePaymentId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return parents;
    const q = search.toLowerCase();
    return parents.filter(p =>
      String(p.name).toLowerCase().includes(q) || String(p.mobile).toLowerCase().includes(q)
    );
  }, [parents, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
          <Users size={24} className="text-srivalli-purple" /> Parents
        </h1>
        <p className="text-muted-foreground text-sm">{parents.length} total parents</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or mobile..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-4 w-full" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No parents found</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p: Record<string, unknown>) => {
            const children = (p.students as Array<Record<string, unknown>>) || [];
            const isExpanded = expandedId === String(p.id);
            return (
              <Card key={String(p.id)} className="overflow-hidden card-hover">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-srivalli-light-purple flex items-center justify-center text-srivalli-purple text-sm font-bold flex-shrink-0">
                      {getInitials(String(p.name))}
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 items-center">
                      <div className="min-w-0 col-span-1">
                        <p className="text-sm font-medium truncate">{String(p.name)}</p>
                        <p className="text-xs text-muted-foreground">{String(p.mobile)}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm truncate">{String(p.email || '—')}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">City</p>
                        <p className="text-sm">{String(p.city || '—')}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">Children</p>
                        <p className="text-sm font-semibold">{children.length}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <AlertDialog open={deleteParentId === String(p.id)} onOpenChange={(open) => !open && setDeleteParentId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => setDeleteParentId(String(p.id))}>
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Parent?</AlertDialogTitle>
                              <AlertDialogDescription>Remove <strong>{String(p.name)}</strong>? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteParent} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(String(p.id))}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-srivalli-light-pink/40 bg-gray-50/50 p-4 space-y-3">
                    {/* Children List */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Children</p>
                      {children.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No children linked</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {children.map((c: Record<string, unknown>) => (
                            <div key={String(c.id)} className="flex items-center gap-2 bg-white rounded-lg p-2 px-3">
                              <Baby size={14} className="text-srivalli-pink" />
                              <span className="text-sm">{String(c.name)}</span>
                              <Badge variant="secondary" className="text-[10px] ml-auto">{String(c.grade || '—')}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Payment History */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Payment History</p>
                      {paymentsLoading ? (
                        <Skeleton className="h-12 w-full" />
                      ) : parentPayments && (parentPayments.payments as unknown[])?.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex gap-3 text-xs">
                            <span className="bg-srivalli-light-green text-srivalli-green px-2 py-1 rounded font-medium">
                              Paid: {formatCurrency(Number(parentPayments.summary?.totalPaid || 0))}
                            </span>
                            <span className="bg-srivalli-light-orange text-srivalli-orange px-2 py-1 rounded font-medium">
                              Pending: {formatCurrency(Number(parentPayments.summary?.totalPending || 0))}
                            </span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                            {(parentPayments.payments as Array<Record<string, unknown>>).map((pay: Record<string, unknown>) => (
                              <div key={String(pay.id)} className="flex items-center justify-between bg-white rounded-lg p-2 px-3 text-xs">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{String((pay.enrollment as Record<string, unknown>)?.course?.title || 'Course')}</p>
                                  <p className="text-muted-foreground">{formatDate(String(pay.createdAt || ''))}</p>
                                </div>
                                <div className="text-right flex-shrink-0 flex items-center gap-3">
                                  <div>
                                    <p className="font-semibold">{formatCurrency(Number(pay.amount))}</p>
                                    <Badge variant={String(pay.status) === 'completed' ? 'default' : 'secondary'} className="text-[9px]">
                                      {String(pay.status)}
                                    </Badge>
                                  </div>
                                  <AlertDialog open={deletePaymentId === String(pay.id)} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => setDeletePaymentId(String(pay.id))}>
                                        <Trash2 size={12} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this payment of {formatCurrency(Number(pay.amount))}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeletePayment} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No payments found</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN TEACHERS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminTeachers() {
  const [teachers, setTeachers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', subject: '', mobile: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/teachers');
      setTeachers(data.teachers || []);
    } catch {
      addToast('Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) {
      addToast('Name, email, and password are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchApi('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (data.success) {
        addToast('Teacher added successfully');
        setShowAddDialog(false);
        setForm({ name: '', email: '', password: '', subject: '', mobile: '' });
        loadTeachers();
      } else {
        addToast(data.message || 'Failed to add teacher', 'error');
      }
    } catch {
      addToast('Failed to add teacher', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const data = await fetchApi(`/api/teachers?id=${deleteId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Teacher deleted');
        setTeachers(prev => prev.filter(t => t.id !== deleteId));
        setDeleteId(null);
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete teacher', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <UserCheck size={24} className="text-srivalli-teal" /> Teachers
          </h1>
          <p className="text-muted-foreground text-sm">{teachers.length} total teachers</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 gradient-teal text-white shadow-md">
          <Plus size={16} /> Add Teacher
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No teachers yet. Add your first teacher!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t: Record<string, unknown>) => {
            const counts = (t._count as Record<string, number>) || {};
            return (
              <Card key={String(t.id)} className="p-4 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-srivalli-light-teal flex items-center justify-center text-srivalli-teal text-sm font-bold">
                      {getInitials(String(t.name))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{String(t.name)}</p>
                      <p className="text-xs text-muted-foreground">{String(t.email)}</p>
                    </div>
                  </div>
                  <AlertDialog open={deleteId === String(t.id)} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => setDeleteId(String(t.id))}>
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>Remove <strong>{String(t.name)}</strong>? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-srivalli-light-teal/30 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-srivalli-teal">{counts.classes || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Classes</p>
                  </div>
                  <div className="bg-srivalli-light-purple/30 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-srivalli-purple">{counts.quizzes || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Quizzes</p>
                  </div>
                  <div className="bg-srivalli-light-pink/30 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-srivalli-pink">{counts.assignments || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Assignments</p>
                  </div>
                </div>
                {t.subject && (
                  <Badge variant="outline" className="text-xs">{String(t.subject)}</Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Teacher Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Fill in the details to register a new teacher.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input placeholder="Full name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email *</Label>
                <Input type="email" placeholder="email@school.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Password *</Label>
                <Input type="password" placeholder="Create password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mobile</Label>
                <Input placeholder="+91 9876543210" value={form.mobile} onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input placeholder="e.g., Mathematics, Science" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting} className="gradient-teal text-white">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN COURSES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminCourses() {
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [courseClasses, setCourseClasses] = useState<Record<string, Array<Record<string, unknown>>>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', tagline: '', weeklyFee: '', monthlyFee: '',
    category: '', topics: '', activities: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/courses');
      setCourses(data.courses || []);
    } catch {
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadClasses = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    try {
      const data = await fetchApi(`/api/classes?courseId=${courseId}`);
      setCourseClasses(prev => ({ ...prev, [courseId]: data.classes || [] }));
    } catch {
      setCourseClasses(prev => ({ ...prev, [courseId]: [] }));
    }
  };

  const handleAdd = async () => {
    if (!form.title || !form.description) {
      addToast('Title and description are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchApi('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weeklyFee: parseInt(form.weeklyFee) || 0,
          monthlyFee: parseInt(form.monthlyFee) || 0,
            topics: form.topics ? form.topics.split(',').map(s => s.trim()).filter(Boolean) : [],
            activities: form.activities ? form.activities.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      if (data.success) {
        addToast('Course created successfully');
        setShowAddDialog(false);
        setForm({ title: '', description: '', tagline: '', weeklyFee: '', monthlyFee: '', category: '', topics: '', activities: '' });
        loadCourses();
      } else {
        addToast(data.message || 'Failed to create course', 'error');
      }
    } catch {
      addToast('Failed to create course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', tagline: '', weeklyFee: '', monthlyFee: '', category: '', topics: '', activities: '' });
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  const openEditDialog = (course: Record<string, unknown>) => {
    setEditCourseId(String(course.id));
    setEditForm({ title: String(course.title || ''), description: String(course.description || ''), tagline: String(course.tagline || ''), weeklyFee: String(course.weeklyFee || ''), monthlyFee: String(course.monthlyFee || ''), category: String(course.category || ''), topics: Array.isArray(course.topics) ? course.topics.join(', ') : '', activities: Array.isArray(course.activities) ? course.activities.join(', ') : '' });
    setShowEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editForm.title || !editForm.description) {
      addToast('Title and description are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchApi('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCourseId,
          ...editForm,
          weeklyFee: parseInt(editForm.weeklyFee) || 0, monthlyFee: parseInt(editForm.monthlyFee) || 0, topics: editForm.topics ? editForm.topics.split(',').map(s => s.trim()).filter(Boolean) : [], activities: editForm.activities ? editForm.activities.split(',').map(s => s.trim()).filter(Boolean) : [] }),
      });
      if (data.success) {
        addToast('Course updated successfully');
        setShowEditDialog(false);
        loadCourses();
      } else {
        addToast(data.message || 'Failed to update course', 'error');
      }
    } catch {
      addToast('Failed to update course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    try {
      const data = await fetchApi(`/api/courses?id=${deleteCourseId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Course deleted successfully');
        loadCourses();
      } else {
        addToast(data.message || 'Failed to delete course', 'error');
      }
    } catch {
      addToast('Failed to delete course', 'error');
    } finally {
      setDeleteCourseId(null);
    }
  };

  const toggleActive = async (course: Record<string, unknown>) => {
    try {
      const data = await fetchApi('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id, isActive: !course.isActive }),
      });
      if (data.success) {
        addToast(`Course ${!course.isActive ? 'activated' : 'deactivated'}`);
        loadCourses();
      }
    } catch {
      addToast('Failed to update course', 'error');
    }
  };

  const categoryColors: Record<string, string> = {
    'academic': 'bg-srivalli-light-pink text-srivalli-pink',
    'creative': 'bg-srivalli-light-purple text-srivalli-purple',
    'coding': 'bg-srivalli-light-teal text-srivalli-teal',
    'sports': 'bg-srivalli-light-green text-srivalli-green',
    'music': 'bg-srivalli-light-orange text-srivalli-orange',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <BookOpen size={24} className="text-srivalli-purple" /> Courses
          </h1>
          <p className="text-muted-foreground text-sm">{courses.length} courses</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 gradient-pink text-white shadow-md">
          <Plus size={16} /> Create Course
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-28 w-full" /></Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No courses yet. Create your first course!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c: Record<string, unknown>) => {
            const isExpanded = expandedCourse === String(c.id);
            const cat = String(c.category || '').toLowerCase();
            const colorClass = categoryColors[cat] || 'bg-gray-100 text-gray-600';
            const classes = courseClasses[String(c.id)] || [];

            return (
              <Card key={String(c.id)} className={`overflow-hidden card-hover ${!c.isActive ? 'opacity-60' : ''}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={colorClass}>{String(c.category || 'General')}</Badge>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(c.isActive)}
                        onCheckedChange={() => toggleActive(c)}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-800" onClick={() => openEditDialog(c)}>
                        <Edit3 size={14} />
                      </Button>
                      <AlertDialog open={deleteCourseId === String(c.id)} onOpenChange={(open) => !open && setDeleteCourseId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteCourseId(String(c.id))}>
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{String(c.title)}</strong>? This will permanently remove the course and its dependencies.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{String(c.title)}</h3>
                  {c.tagline && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{String(c.tagline)}</p>}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-srivalli-light-green/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Weekly</p>
                      <p className="text-sm font-bold text-srivalli-green">{formatCurrency(Number(c.weeklyFee || 0))}</p>
                    </div>
                    <div className="bg-srivalli-light-pink/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="text-sm font-bold text-srivalli-pink">{formatCurrency(Number(c.monthlyFee || 0))}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => loadClasses(String(c.id))}
                  >
                    <Calendar size={14} />
                    {isExpanded ? 'Hide Classes' : 'Manage Classes'}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="border-t border-srivalli-light-pink/40 bg-gray-50/50 p-3">
                    {classes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No classes scheduled</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                        {classes.map((cls: Record<string, unknown>) => (
                          <div key={String(cls.id)} className="flex items-center justify-between bg-white rounded-lg p-2 px-3">
                            <div>
                              <p className="text-xs font-medium">{String(cls.title)}</p>
                              <p className="text-[10px] text-muted-foreground">{formatDate(String(cls.date))} • {formatTime(String(cls.time))}</p>
                            </div>
                            <Badge variant={String(cls.status) === 'completed' ? 'default' : String(cls.status) === 'cancelled' ? 'destructive' : 'secondary'} className="text-[9px]">
                              {String(cls.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Course Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course to your school catalog.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input placeholder="Course title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description *</Label>
                <Textarea placeholder="Detailed description" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tagline</Label>
                <Input placeholder="Short catchy tagline" value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Weekly Fee (₹)</Label>
                  <Input type="number" value={form.weeklyFee} onChange={(e) => setForm(f => ({ ...f, weeklyFee: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Fee (₹)</Label>
                  <Input type="number" value={form.monthlyFee} onChange={(e) => setForm(f => ({ ...f, monthlyFee: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input placeholder="e.g., academic, creative, coding" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topics (comma-separated)</Label>
                <Textarea placeholder="Public Speaking, Debating, Pronunciation" rows={2} value={form.topics} onChange={(e) => setForm(f => ({ ...f, topics: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Activities (comma-separated)</Label>
                <Textarea placeholder="Group Discussions, Roleplay, Speeches" rows={2} value={form.activities} onChange={(e) => setForm(f => ({ ...f, activities: e.target.value }))} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting} className="gradient-pink text-white">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update the details of the course.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input placeholder="Course title" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description *</Label>
                <Textarea placeholder="Detailed description" rows={3} value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tagline</Label>
                <Input placeholder="Short catchy tagline" value={editForm.tagline} onChange={(e) => setEditForm(f => ({ ...f, tagline: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Weekly Fee (₹)</Label>
                  <Input type="number" value={editForm.weeklyFee} onChange={(e) => setEditForm(f => ({ ...f, weeklyFee: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Fee (₹)</Label>
                  <Input type="number" value={editForm.monthlyFee} onChange={(e) => setEditForm(f => ({ ...f, monthlyFee: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input placeholder="e.g., academic, creative, coding" value={editForm.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topics (comma-separated)</Label>
                <Textarea placeholder="Topic 1, Topic 2" rows={2} value={editForm.topics} onChange={(e) => setEditForm(f => ({ ...f, topics: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Activities (comma-separated)</Label>
                <Textarea placeholder="Activity 1, Activity 2" rows={2} value={editForm.activities} onChange={(e) => setEditForm(f => ({ ...f, activities: e.target.value }))} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="gradient-teal text-white">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Edit3 size={16} className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN PAYMENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [feesData, setFeesData] = useState<Record<string, unknown>>({});
  const [revenueData, setRevenueData] = useState<Record<string, unknown>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [error, setError] = useState('');

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ enrollmentId: '', amount: '', plan: 'Monthly Plan', method: 'cash' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [fees, revenue] = await Promise.allSettled([
          fetchApi('/api/reports?type=fees'),
          fetchApi('/api/reports?type=revenue'),
        ]);
        setFeesData(fees.status === 'fulfilled' ? fees.value : {});
        setRevenueData(revenue.status === 'fulfilled' ? revenue.value : {});
      } catch {
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchApi('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPayment, amount: Number(newPayment.amount) })
      });
      if (data.success) {
        addToast('Payment added successfully');
        setShowAddPayment(false);
        setNewPayment({ enrollmentId: '', amount: '', plan: 'Monthly Plan', method: 'cash' });
        setLoading(true);
        const [fees, revenue] = await Promise.allSettled([
          fetchApi('/api/reports?type=fees'),
          fetchApi('/api/reports?type=revenue'),
        ]);
        setFeesData(fees.status === 'fulfilled' ? fees.value : {});
        setRevenueData(revenue.status === 'fulfilled' ? revenue.value : {});
        setLoading(false);
      } else {
        addToast(data.message || 'Failed to add payment', 'error');
      }
    } catch (err: any) { addToast(err.message || 'Error adding payment', 'error'); }
  };

  const feesSummary = feesData.summary as Record<string, unknown> | undefined;
  const revenueSummary = revenueData.summary as Record<string, unknown> | undefined;
  const monthlyRevenue = revenueData.monthlyRevenue as Record<string, number> | undefined;
  const planRevenue = revenueData.planRevenue as Record<string, number> | undefined;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="p-8 text-center"><AlertCircle className="mx-auto text-red-400 mb-3" size={40} /><p className="text-muted-foreground">{error}</p></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <CreditCard size={24} className="text-srivalli-green" /> Payments
          </h1>
          <p className="text-muted-foreground text-sm">Track all payments and revenue</p>
        </div>
        <Button onClick={() => setShowAddPayment(true)} className="bg-srivalli-green hover:bg-srivalli-green/90 text-white">
          <Plus size={16} className="mr-2" /> Add Payment
        </Button>
      </div>

      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Manual Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Enrollment ID</Label>
              <Input required value={newPayment.enrollmentId} onChange={e => setNewPayment({...newPayment, enrollmentId: e.target.value})} placeholder="e.g. Enr-xyz123" />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input required type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} placeholder="e.g. 5000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select required value={newPayment.plan} onValueChange={v => setNewPayment({...newPayment, plan: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly Plan">Monthly Plan</SelectItem>
                    <SelectItem value="Quarterly Plan">Quarterly Plan</SelectItem>
                    <SelectItem value="Annual Plan">Annual Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select required value={newPayment.method} onValueChange={v => setNewPayment({...newPayment, method: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-srivalli-green hover:bg-srivalli-green/90 text-white">Save Payment</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>
          ))
        ) : (
          [
            { label: 'Total Collected', value: formatCurrency(Number(feesSummary?.totalCollected || 0)), icon: <Wallet size={20} />, color: 'text-srivalli-green', bg: 'bg-srivalli-light-green' },
            { label: 'Total Pending', value: formatCurrency(Number(feesSummary?.totalPending || 0)), icon: <Clock size={20} />, color: 'text-srivalli-orange', bg: 'bg-srivalli-light-orange' },
            { label: 'Total Transactions', value: String(feesSummary?.totalPayments || 0), icon: <Receipt size={20} />, color: 'text-srivalli-purple', bg: 'bg-srivalli-light-purple' },
            { label: 'Avg. Transaction', value: formatCurrency(Number(revenueSummary?.averageTransactionValue || 0)), icon: <IndianRupee size={20} />, color: 'text-srivalli-pink', bg: 'bg-srivalli-light-pink' },
          ].map((card, i) => (
            <Card key={i} className="p-4 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <Filter size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Revenue Breakdown */}
        <Card className="fun-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-srivalli-green" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : monthlyRevenue && Object.keys(monthlyRevenue).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(monthlyRevenue).map(([month, amount]) => (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{month}</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-teal"
                        style={{ width: `${Math.max((amount / Math.max(...Object.values(monthlyRevenue), 1)) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No revenue data</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Revenue Breakdown */}
        <Card className="fun-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart size={18} className="text-srivalli-purple" />
              Plan Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-srivalli-light-teal/30 rounded-xl">
                  <div className="h-12 w-12 rounded-xl bg-srivalli-light-teal flex items-center justify-center text-srivalli-teal">
                    <Calendar size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Weekly Plans</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(planRevenue?.weekly || 0))}</p>
                  </div>
                  <Badge className="bg-srivalli-teal text-white">{String((feesData.planBreakdown as Record<string, number>)?.weekly || 0)} payments</Badge>
                </div>
                <div className="flex items-center gap-4 p-4 bg-srivalli-light-pink/30 rounded-xl">
                  <div className="h-12 w-12 rounded-xl bg-srivalli-light-pink flex items-center justify-center text-srivalli-pink">
                    <CalendarCheck size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Monthly Plans</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(planRevenue?.monthly || 0))}</p>
                  </div>
                  <Badge className="gradient-pink text-white">{String((feesData.planBreakdown as Record<string, number>)?.monthly || 0)} payments</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN DEMO REQUESTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const demoStatusFlow = ['New', 'Contacted', 'Scheduled', 'Completed', 'Cancelled'];
const demoStatusColors: Record<string, string> = {
  New: 'bg-srivalli-light-pink text-srivalli-pink',
  Contacted: 'bg-srivalli-light-orange text-srivalli-orange',
  Scheduled: 'bg-srivalli-light-blue text-srivalli-blue',
  Completed: 'bg-srivalli-light-green text-srivalli-green',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export function AdminDemoRequests() {
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/demo-request');
      setRequests(data.demoRequests || []);
    } catch {
      addToast('Failed to load demo requests', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const data = await fetchApi('/api/demo-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (data.success) {
        addToast(`Status updated to ${newStatus}`);
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } else {
        addToast(data.message || 'Update failed', 'error');
      }
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const data = await fetchApi(`/api/demo-request?id=${deleteId}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Request deleted successfully');
        setRequests(prev => prev.filter(r => r.id !== deleteId));
      } else {
        addToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      addToast('Failed to delete request', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredRequests = requests.filter(r => activeTab === 'All' || r.status === activeTab);

  const counts = {
    All: requests.length,
    New: requests.filter(r => r.status === 'New').length,
    Processing: requests.filter(r => r.status === 'Processing').length,
    Contacted: requests.filter(r => r.status === 'Contacted').length,
    Completed: requests.filter(r => r.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <CalendarCheck size={24} className="text-srivalli-orange" /> Demo Requests
          </h1>
          <p className="text-muted-foreground text-sm">Manage new course inquiries</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto mb-4">
          <TabsTrigger value="All" className="text-xs py-2">All ({counts.All})</TabsTrigger>
          <TabsTrigger value="New" className="text-xs py-2">New ({counts.New})</TabsTrigger>
          <TabsTrigger value="Processing" className="text-xs py-2">Processing ({counts.Processing})</TabsTrigger>
          <TabsTrigger value="Contacted" className="text-xs py-2">Contacted ({counts.Contacted})</TabsTrigger>
          <TabsTrigger value="Completed" className="text-xs py-2">Completed ({counts.Completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <CalendarCheck size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No {activeTab === 'All' ? '' : activeTab.toLowerCase()} demo requests found</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredRequests.map((req: Record<string, unknown>) => {
                const mobile = String(req.mobile || req.parent?.mobile || '');
                return (
                  <Card key={String(req.id)} className="p-4 card-hover overflow-visible">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Parent</p>
                          <p className="text-sm font-medium">{String(req.parentName || req.name || 'Unknown')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Child</p>
                          <p className="text-sm">
                            {req.childName ? String(req.childName) : '-'} 
                            {req.childAge ? ` (${String(req.childAge)}y)` : ''}
                          </p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-xs text-muted-foreground">Preferred Time</p>
                          <p className="text-sm">
                            {req.preferredDate ? formatDate(String(req.preferredDate)) : '-'}
                            {req.preferredTime ? ` - ${formatTime(String(req.preferredTime))}` : ''}
                          </p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-xs text-muted-foreground">Course Interest</p>
                          <p className="text-sm truncate">{String(req.courseInterest || 'Any')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <Select 
                          value={String(req.status || 'New')} 
                          onValueChange={(val) => updateStatus(String(req.id), val)}
                        >
                          <SelectTrigger className="h-8 text-xs w-[130px] border-gray-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">
                              <span className="flex items-center gap-2"><Badge className="bg-srivalli-light-pink text-srivalli-pink w-2 h-2 p-0 rounded-full"></Badge> New</span>
                            </SelectItem>
                            <SelectItem value="Processing">
                              <span className="flex items-center gap-2"><Badge className="bg-srivalli-light-orange text-srivalli-orange w-2 h-2 p-0 rounded-full"></Badge> Processing</span>
                            </SelectItem>
                            <SelectItem value="Contacted">
                              <span className="flex items-center gap-2"><Badge className="bg-srivalli-light-purple text-srivalli-purple w-2 h-2 p-0 rounded-full"></Badge> Contacted</span>
                            </SelectItem>
                            <SelectItem value="Completed">
                              <span className="flex items-center gap-2"><Badge className="bg-srivalli-light-green text-srivalli-green w-2 h-2 p-0 rounded-full"></Badge> Completed</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {mobile && mobile !== 'undefined' && (
                          <>
                            <Button size="sm" variant="outline" className="text-xs h-8 gap-1" asChild>
                              <a href={`tel:${mobile}`}>
                                <PhoneCall size={12} /> <span className="hidden sm:inline">Call</span>
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-8 gap-1" asChild>
                              <a href={`https://wa.me/${mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                <MessageCircle size={12} /> <span className="hidden sm:inline">WhatsApp</span>
                              </a>
                            </Button>
                          </>
                        )}
                        
                        <AlertDialog open={deleteId === String(req.id)} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setDeleteId(String(req.id))}>
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this demo request from <strong>{String(req.parentName || req.name || 'Unknown')}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {req.message && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                        <p className="text-muted-foreground text-xs font-medium mb-1">Message</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{String(req.message)}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN REPORTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminReports() {
  const [activeTab, setActiveTab] = useState('registrations');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const data = await fetchApi(`/api/reports?type=${activeTab}`);
        setReportData(data);
      } catch {
        setReportData({});
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [activeTab]);

  const handleDownload = (type: string) => {
    addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report download started`, 'info');
  };

  const summary = reportData.summary as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <BarChart3 size={24} className="text-srivalli-orange" /> Reports
          </h1>
          <p className="text-muted-foreground text-sm">Comprehensive analytics and insights</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => handleDownload(activeTab)}>
          <Download size={16} /> Download Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="registrations" className="text-xs">Registrations</TabsTrigger>
          <TabsTrigger value="enrollments" className="text-xs">Enrollments</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs">Fees</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
        </TabsList>

        {/* Registrations */}
        <TabsContent value="registrations" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Students', value: summary?.totalStudents, icon: <GraduationCap size={20} />, color: 'text-srivalli-pink', bg: 'bg-srivalli-light-pink' },
                  { label: 'Total Parents', value: summary?.totalParents, icon: <Users size={20} />, color: 'text-srivalli-purple', bg: 'bg-srivalli-light-purple' },
                  { label: 'Total Teachers', value: summary?.totalTeachers, icon: <UserCheck size={20} />, color: 'text-srivalli-teal', bg: 'bg-srivalli-light-teal' },
                ].map((card, i) => (
                  <Card key={i} className="p-4 card-hover">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>{card.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-bold">{String(card.value || 0)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="fun-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Monthly Registrations (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries((reportData.monthlyRegistrations as Record<string, number>) || {}).map(([month, count]) => (
                      <div key={month} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{month}</span>
                          <span className="font-semibold">{count} registrations</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full gradient-pink"
                            style={{ width: `${Math.max((count / Math.max(...Object.values((reportData.monthlyRegistrations as Record<string, number>) || { _: 1 }), 1)) * 100, 3)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Enrollments */}
        <TabsContent value="enrollments" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: summary?.totalEnrollments, color: 'text-srivalli-pink', bg: 'bg-srivalli-light-pink' },
                  { label: 'Active', value: summary?.activeEnrollments, color: 'text-srivalli-teal', bg: 'bg-srivalli-light-teal' },
                  { label: 'Completed', value: summary?.completedEnrollments, color: 'text-srivalli-green', bg: 'bg-srivalli-light-green' },
                ].map((card, i) => (
                  <Card key={i} className="p-4 card-hover">
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>{String(card.value || 0)}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="fun-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Enrollments by Course</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {((reportData.byCourse as Array<Record<string, unknown>>) || []).map((c: Record<string, unknown>, i: number) => (
                      <div key={String(c.courseId)} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm">{String(c.courseTitle)}</span>
                        </div>
                        <Badge variant="secondary">{String(c.enrollmentCount)}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          {loading ? (
            <Card className="p-4"><Skeleton className="h-32 w-full" /></Card>
          ) : (
            <>
              <Card className="p-6 text-center fun-shadow">
                <p className="text-xs text-muted-foreground mb-2">Overall Attendance Rate</p>
                <p className={`text-5xl font-bold ${(Number(summary?.overallPercentage) || 0) >= 75 ? 'text-srivalli-green' : 'text-srivalli-orange'}`}>
                  {String(summary?.overallPercentage || 0)}%
                </p>
                <Progress value={Number(summary?.overallPercentage) || 0} className="h-3 mt-4 max-w-md mx-auto" />
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Records', value: summary?.totalRecords, icon: <FileText size={18} />, bg: 'bg-srivalli-light-pink', color: 'text-srivalli-pink' },
                  { label: 'Present', value: summary?.presentRecords, icon: <CheckCircle2 size={18} />, bg: 'bg-srivalli-light-green', color: 'text-srivalli-green' },
                  { label: 'Absent', value: summary?.absentRecords, icon: <XCircle size={18} />, bg: 'bg-srivalli-light-orange', color: 'text-srivalli-orange' },
                ].map((card, i) => (
                  <Card key={i} className="p-4 card-hover">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>{card.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-bold">{String(card.value || 0)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Fees */}
        <TabsContent value="fees" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Payments', value: String(summary?.totalPayments || 0), icon: <Receipt size={18} />, bg: 'bg-srivalli-light-purple', color: 'text-srivalli-purple' },
                  { label: 'Collected', value: formatCurrency(Number(summary?.totalCollected || 0)), icon: <Wallet size={18} />, bg: 'bg-srivalli-light-green', color: 'text-srivalli-green' },
                  { label: 'Pending', value: formatCurrency(Number(summary?.totalPending || 0)), icon: <Clock size={18} />, bg: 'bg-srivalli-light-orange', color: 'text-srivalli-orange' },
                  { label: 'Completion Rate', value: `${summary?.totalPayments ? Math.round((Number(summary?.completedPayments || 0) / Number(summary?.totalPayments)) * 100) : 0}%`, icon: <PieChart size={18} />, bg: 'bg-srivalli-light-pink', color: 'text-srivalli-pink' },
                ].map((card, i) => (
                  <Card key={i} className="p-4 card-hover">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-8 w-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>{card.icon}</div>
                      <p className="text-[10px] text-muted-foreground">{card.label}</p>
                    </div>
                    <p className="text-lg font-bold">{card.value}</p>
                  </Card>
                ))}
              </div>
              <Card className="fun-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Plan Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4">
                    {[
                      { plan: 'Weekly', count: (reportData.planBreakdown as Record<string, number>)?.weekly || 0, color: 'bg-srivalli-teal text-white' },
                      { plan: 'Monthly', count: (reportData.planBreakdown as Record<string, number>)?.monthly || 0, color: 'gradient-pink text-white' },
                    ].map((p, i) => (
                      <div key={i} className="flex-1 p-4 rounded-xl bg-gray-50 text-center">
                        <p className="text-3xl font-bold">{p.count}</p>
                        <p className="text-xs text-muted-foreground">{p.plan} Plans</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Revenue', value: formatCurrency(Number(summary?.totalRevenue || 0)), icon: <IndianRupee size={20} />, bg: 'bg-srivalli-light-green', color: 'text-srivalli-green' },
                  { label: 'Transactions', value: String(summary?.transactionCount || 0), icon: <Receipt size={20} />, bg: 'bg-srivalli-light-purple', color: 'text-srivalli-purple' },
                  { label: 'Avg. Value', value: formatCurrency(Number(summary?.averageTransactionValue || 0)), icon: <TrendingUp size={20} />, bg: 'bg-srivalli-light-pink', color: 'text-srivalli-pink' },
                ].map((card, i) => (
                  <Card key={i} className="p-4 card-hover">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>{card.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-bold">{card.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="fun-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Monthly Revenue Breakdown</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleDownload('revenue')}>
                      <Download size={14} className="mr-1" /> Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries((reportData.monthlyRevenue as Record<string, number>) || {}).map(([month, amount]) => {
                      const maxRev = Math.max(...Object.values((reportData.monthlyRevenue as Record<string, number>) || { _: 1 }), 1);
                      return (
                        <div key={month} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{month}</span>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                          </div>
                          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-warm"
                              style={{ width: `${Math.max((amount / maxRev) * 100, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(reportData.planRevenue as Record<string, number>) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">By Plan Type</p>
                      <div className="flex gap-3 text-xs">
                        <span className="bg-srivalli-light-teal text-srivalli-teal px-2 py-1 rounded">Weekly: {formatCurrency(Number((reportData.planRevenue as Record<string, number>)?.weekly || 0))}</span>
                        <span className="bg-srivalli-light-pink text-srivalli-pink px-2 py-1 rounded">Monthly: {formatCurrency(Number((reportData.planRevenue as Record<string, number>)?.monthly || 0))}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN SETTINGS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminSettings() {
  const [settings, setSettings] = useState({
    schoolName: 'Srivalli SmartSpeak',
    weeklyFee: '1000',
    monthlyFee: '5000',
    contactPhone: '+91 98765 43210',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/api/settings');
        if (res?.settings) {
          setSettings({
            schoolName: res.settings.schoolName || 'Srivalli SmartSpeak',
            weeklyFee: res.settings.weeklyFee || '1000',
            monthlyFee: res.settings.monthlyFee || '5000',
            contactPhone: res.settings.contactPhone || '+91 98765 43210',
          });
        }
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await fetchApi('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(settings),
      });
      if (data.success) {
        addToast('Settings saved successfully');
      } else {
        addToast('Failed to save settings', 'error');
      }
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const handleUpdateEmail = async () => {
    if (!emailForm.newEmail || !emailForm.password) {
      addToast('Please enter both new email and current password', 'error');
      return;
    }
    setUpdatingEmail(true);
    try {
      const data = await fetchApi('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(emailForm),
      });
      if (data.success) {
        addToast('Email updated successfully. You may need to log in again.');
        setEmailForm({ newEmail: '', password: '' });
      } else {
        addToast(data.message || 'Failed to update email', 'error');
      }
    } catch {
      addToast('Failed to update email. Please try again.', 'error');
    } finally {
      setUpdatingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
          <Settings size={24} className="text-gray-500" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm">Manage school configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* School Settings */}
        <Card className="lg:col-span-2 fun-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders size={18} className="text-srivalli-pink" />
              School Settings
            </CardTitle>
            <CardDescription>Configure your school&apos;s basic information and fee defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">School Name</Label>
                  <Input value={settings.schoolName} onChange={(e) => setSettings(s => ({ ...s, schoolName: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Default Weekly Fee (₹)</Label>
                    <Input type="number" value={settings.weeklyFee} onChange={(e) => setSettings(s => ({ ...s, weeklyFee: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Default Monthly Fee (₹)</Label>
                    <Input type="number" value={settings.monthlyFee} onChange={(e) => setSettings(s => ({ ...s, monthlyFee: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Contact Phone</Label>
                  <Input value={settings.contactPhone} onChange={(e) => setSettings(s => ({ ...s, contactPhone: e.target.value }))} />
                </div>
                <div className="pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gradient-pink text-white shadow-md">
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Save Settings
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="lg:col-span-2 fun-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail size={18} className="text-srivalli-purple" />
              Update Account Email
            </CardTitle>
            <CardDescription>Change the login email for this account. Requires your current password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium">New Email Address</Label>
              <Input type="email" placeholder="new.email@example.com" value={emailForm.newEmail} onChange={(e) => setEmailForm(f => ({ ...f, newEmail: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Current Password</Label>
              <Input type="password" placeholder="Verify password to confirm" value={emailForm.password} onChange={(e) => setEmailForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="pt-2">
              <Button onClick={handleUpdateEmail} disabled={updatingEmail} className="gradient-purple text-white shadow-md">
                {updatingEmail ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Update Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="fun-shadow h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Info size={18} className="text-srivalli-teal" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Version', value: 'v2.0.0' },
              { label: 'Framework', value: 'Next.js 16' },
              { label: 'Database', value: 'SQLite + Prisma' },
              { label: 'Last Updated', value: formatDate(new Date().toISOString()) },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
            <div className="pt-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-srivalli-green animate-pulse" />
                <span className="text-xs text-srivalli-green font-medium">System Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN TEACHER-STUDENT ASSIGNMENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface TeacherStudentAssignment {
  id: string;
  teacherId: string;
  studentId: string;
  courseIds: string[];
  assignedDate: string;
  notes: string;
  createdAt?: string;
  teacherName?: string;
  studentName?: string;
  courseNames?: string[];
}

interface TeacherOption {
  id: string;
  name: string;
  subject?: string;
}

interface StudentOptionAdmin {
  id: string;
  name: string;
  grade?: string;
}

interface CourseOption {
  id: string;
  title: string;
}

export function AdminTeacherAssignments() {
  const [assignments, setAssignments] = useState<TeacherStudentAssignment[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOptionAdmin[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    teacherId: '',
    studentId: '', // kept for backwards compatibility if needed, but not used in UI
    courseIds: [] as string[],
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [aRes, tRes, sRes, cRes] = await Promise.all([
        fetchApi('/api/teacher-assignments'),
        fetchApi('/api/teachers'),
        fetchApi('/api/students'),
        fetchApi('/api/courses'),
      ]);
      if (aRes.success) setAssignments(aRes.assignments);
      if (tRes.success) setTeachers(tRes.teachers.map((t: any) => ({ id: t.id, name: t.name, subject: t.subject })));
      if (sRes.success) setStudents(sRes.students.map((s: any) => ({ id: s.id, name: s.name, grade: s.grade })));
      if (cRes.success) setCourses(cRes.courses.map((c: any) => ({ id: c.id, title: c.title })));
    } catch {
      addToast('Failed to load assignment data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.teacherId || form.courseIds.length === 0) {
      addToast('Teacher and at least one course are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchApi('/api/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assignedDate: new Date().toISOString().split('T')[0],
        }),
      });
      if (data.success) {
        addToast('Assignment created successfully!');
        setCreateOpen(false);
        setForm({ teacherId: '', studentId: '', courseIds: [], notes: '' });
        fetchData();
      } else {
        addToast(data.message || 'Failed to create assignment', 'error');
      }
    } catch {
      addToast('Failed to create assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const data = await fetchApi(`/api/teacher-assignments?id=${id}`, { method: 'DELETE' });
      if (data.success) {
        addToast('Assignment removed successfully');
        fetchData();
      } else {
        addToast(data.message || 'Failed to remove assignment', 'error');
      }
    } catch {
      addToast('Failed to remove assignment', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const toggleCourse = (courseId: string) => {
    setForm(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || 'Unknown Teacher';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getCourseNames = (courseIds: string[]) => {
    return courseIds
      .map(id => courses.find(c => c.id === id)?.title)
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <UserCheck size={24} className="text-gray-500" /> Teacher Assignments
          </h1>
          <p className="text-muted-foreground text-sm">Manage teacher course assignments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 gradient-pink text-white shadow-md rounded-xl">
          <Plus size={16} />
          New Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 card-hover cursor-default">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Total Assignments</p>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{assignments.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-srivalli-light-pink flex items-center justify-center text-srivalli-pink flex-shrink-0">
              <UserCheck size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-4 card-hover cursor-default">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Teachers Assigned</p>
              <p className="text-xl lg:text-2xl font-bold text-srivalli-teal">{new Set(assignments.map(a => a.teacherId)).size}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-srivalli-light-teal flex items-center justify-center text-srivalli-teal flex-shrink-0">
              <Users size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-4 card-hover cursor-default">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Courses Assigned</p>
              <p className="text-xl lg:text-2xl font-bold text-srivalli-purple">{new Set(assignments.flatMap(a => a.courseIds)).size}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-srivalli-light-purple flex items-center justify-center text-srivalli-purple flex-shrink-0">
              <BookOpen size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Assignments List */}
      <Card className="fun-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookMarked size={18} className="text-srivalli-pink" />
              Current Assignments
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{assignments.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="max-h-96">
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-srivalli-light-pink mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No assignments yet</p>
                <p className="text-muted-foreground text-xs mt-1">Click &quot;New Assignment&quot; to create one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(assignment => {
                  const courseNames = getCourseNames(assignment.courseIds || []);
                  return (
                    <div key={assignment.id} className="p-4 rounded-xl border border-srivalli-light-pink/20 hover:bg-srivalli-light-pink/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-srivalli-light-teal text-srivalli-teal text-xs font-bold">
                              {getInitials(getTeacherName(assignment.teacherId))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">{getTeacherName(assignment.teacherId)}</p>
                              {assignment.studentId && (
                                <>
                                  <span className="text-xs text-muted-foreground">â†’</span>
                                  <p className="text-sm font-medium text-srivalli-purple">{getStudentName(assignment.studentId)}</p>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {courseNames.map((name, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {name}
                                </Badge>
                              ))}
                              {courseNames.length === 0 && (
                                <Badge variant="outline" className="text-[10px]">No courses</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(assignment.assignedDate)}
                              </span>
                              {assignment.notes && (
                                <span className="truncate max-w-48">{assignment.notes}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={deleting === assignment.id}
                        >
                          {deleting === assignment.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
              <UserCheck className="w-5 h-5 text-srivalli-pink" />
              New Teacher Assignment
            </DialogTitle>
            <DialogDescription>
              Assign a teacher to specific courses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Teacher Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Teacher *</Label>
              <Select value={form.teacherId} onValueChange={v => setForm(f => ({ ...f, teacherId: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.subject ? ` (${t.subject})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Select Hidden for Course-Level Assignment */}

            {/* Course Checkboxes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Courses</Label>
              <div className="p-3 rounded-xl bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                {courses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No courses available</p>
                ) : (
                  courses.map(course => (
                    <label key={course.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="rounded border-gray-500 text-srivalli-pink focus:ring-srivalli-pink"
                      />
                      <span className="text-sm">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !form.teacherId || form.courseIds.length === 0}
              className="gradient-pink text-white shadow-md rounded-xl gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADMIN ACTIVITY (TOP OF FUNNEL)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AdminActivity() {
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/activity/admin');
      setActivities(data.activities || []);
    } catch {
      addToast('Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Activity size={24} className="text-srivalli-pink" /> Course Activity
          </h1>
          <p className="text-muted-foreground text-sm">Monitor user exploration and engagement</p>
        </div>
        <Button variant="outline" onClick={loadActivities}>
          Refresh
        </Button>
      </div>

      <Card className="border-none fun-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>User / Session</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a: Record<string, unknown>) => (
                  <TableRow key={String(a.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {a.uid ? (
                          <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center text-white text-xs">
                            {getInitials(String(a.userName || 'U'))}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <UserCircle size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{a.uid ? String(a.userName) : 'Anonymous Visitor'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{a.uid ? String(a.userRole) : String(a.sessionId)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-srivalli-light-pink/30 text-srivalli-pink border-srivalli-pink/20">
                        {String(a.eventType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {a.courseName ? String(a.courseName) : <span className="text-muted-foreground text-xs">N/A</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(String(a.timestamp))} {formatTime(String(a.timestamp))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}




export function AdminCertificates() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', courseId: '', certificateUrl: '', title: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWithAuth('/api/students').then(r => r.json()),
      fetchWithAuth('/api/courses').then(r => r.json()),
      fetchWithAuth('/api/certificates').then(r => r.json())
    ]).then(([sData, cData, certData]) => {
      if (cancelled) return;
      if (sData.success) setStudents(sData.students || []);
      if (cData.success) setCourses(cData.courses || []);
      if (certData.success) setCertificates(certData.certificates || []);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { const cleanup = fetchData(); return cleanup; }, [fetchData]);

  const handleIssue = async () => {
    if (!form.studentId || !form.courseId || !form.certificateUrl) {
      addToast('Student, Course, and Certificate Link are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        addToast('Certificate issued successfully!', 'success');
        setForm({ studentId: '', courseId: '', certificateUrl: '', title: '' });
        fetchData();
      } else {
        addToast(data.message || 'Failed to issue certificate', 'error');
      }
    } catch {
      addToast('Error issuing certificate', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 bounce-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Certificates</h2>
        <p className="text-muted-foreground">Issue and manage student certificates with external links.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 fun-shadow border-0">
          <CardHeader className="bg-srivalli-light-pink pb-4">
            <CardTitle className="text-lg">Issue New Certificate</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
                <option value="">Select Student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})}>
                <option value="">Select Course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Certificate Link (URL) *</Label>
              <Input placeholder="https://drive.google.com/..." value={form.certificateUrl} onChange={e => setForm({...form, certificateUrl: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input placeholder="e.g. Master Orator 2026" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl" />
            </div>
            <Button className="w-full rounded-xl gradient-pink text-white font-bold" onClick={handleIssue} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Certificate
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 fun-shadow border-0">
          <CardHeader className="bg-srivalli-light-purple pb-4">
            <CardTitle className="text-lg">Issued Certificates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {certificates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No certificates issued yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {certificates.map(cert => {
                  const student = students.find(s => s.id === cert.studentId);
                  const course = courses.find(c => c.id === cert.courseId);
                  return (
                    <div key={cert.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-srivalli-pink/10 rounded-full">
                          <Award className="w-5 h-5 text-srivalli-pink" />
                        </div>
                        <div>
                          <p className="font-semibold">{student?.name || 'Unknown Student'}</p>
                          <p className="text-xs text-muted-foreground">{course?.title || cert.title || 'Certificate'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cert.certificateUrl && (
                          <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => window.open(cert.certificateUrl, '_blank')}>
                            <LinkIcon className="w-3 h-3 mr-1" /> View Link
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground bg-srivalli-light-gray px-2 py-1 rounded">
                          {formatDate(cert.issuedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
