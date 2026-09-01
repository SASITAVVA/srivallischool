'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, MapPin, Clock, ChevronRight, CheckCircle2,
  Star, MessageCircle, BookOpen, Mic, ArrowRight, Sparkles,
  Heart, Target, Users, Shield, Award, Menu, X, Send,
  GraduationCap, Lightbulb, Globe, PenTool, Zap
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { trackActivity } from '@/lib/activity';

type Screen = import('@/lib/store').Screen;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const navigate = (s: Screen) => useAppStore.getState().navigate(s);
const addToast = (msg: string, type?: 'success' | 'error' | 'info') =>
  useAppStore.getState().addToast(msg, type);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. HOME PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [courses, setCourses] = useState<{id:string,name:string,fee:number,description:string,duration:string,category:string,status:string, features?: string[]}[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [settings, setSettings] = useState<{ weeklyFee: string, monthlyFee: string }>({ weeklyFee: '1000', monthlyFee: '5000' });

  // Fetch courses from Firestore
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => {
        const fetchedCourses = d.courses || d || [];
        if (fetchedCourses.length > 0) setCourses(fetchedCourses);
        setIsLoadingCourses(false);
      })
      .catch(() => setIsLoadingCourses(false));
      
    // Fetch settings for dynamic pricing
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setSettings({
            weeklyFee: d.settings.weeklyFee || '1000',
            monthlyFee: d.settings.monthlyFee || '5000'
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* â”€â”€ Sticky Header â”€â”€ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-srivalli-light-pink">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <button onClick={() => navigate('HOME')} className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <span className="text-xl font-extrabold tracking-tight text-gradient"><span className="sr-only">Srivalli Smartspeak</span><span aria-hidden="true">SRIVALLI SMARTSPEAK</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {(['About','Courses','Contact'] as const).map(l => (
              <button key={l} onClick={() => navigate(l.toUpperCase() as Screen)} className="hover:text-srivalli-pink transition-colors">
                {l}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('LOGIN')}>Login</Button>
            <Button size="sm" className="gradient-pink border border-[#c2185b] text-white" onClick={() => navigate('REGISTER_STUDENT')}>Register</Button>
          </div>
          <button className="md:hidden" aria-label="Toggle Menu" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden px-4 pb-4 space-y-3 bg-white border-t border-srivalli-light-pink">
            {(['About','Courses','Contact'] as const).map(l => (
              <button key={l} onClick={() => { navigate(l.toUpperCase() as Screen); setMobileMenu(false); }}
                className="block w-full text-left py-2 text-gray-700 font-medium">{l}</button>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('LOGIN')}>Login</Button>
              <Button size="sm" className="flex-1 gradient-pink border border-[#c2185b] text-white" onClick={() => navigate('REGISTER_STUDENT')}>Register</Button>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1">
        {/* ── Hero Section ── */}
        <section className="gradient-hero text-white py-12 md:py-16 px-4">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 text-center lg:text-left space-y-5">
              <Badge className="bg-gray-800 text-white border-white/50 hover:bg-gray-700 text-sm px-4 py-1.5 mb-2 rounded-full">
                ⭐ Kids Age 7+ | 100% Online Learning
              </Badge>
              <h1 className="text-[1.9rem] sm:text-4xl md:text-5xl lg:text-[3.2rem] xl:text-[3.8rem] font-black leading-[1.2] tracking-tight text-white drop-shadow-sm mt-4 whitespace-nowrap">
                <span className="block">Speak Clearly</span>
                <span className="block text-[#F9CA24]">Think Creatively</span>
                <span className="block">Shine Confidently</span>
              </h1>
              <div className="inline-block mx-auto lg:mx-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 shadow-sm">
                <span className="text-sm sm:text-base md:text-lg font-extrabold tracking-[0.15em] text-white uppercase">
                  Practice. Speak. Improve.
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold mt-6 text-white tracking-wide">
                Start Building Skills for Life!
              </h2>
              <p className="text-base md:text-lg text-white max-w-xl font-medium leading-relaxed mt-4 mx-auto lg:mx-0">
                An online skill-development platform specially designed for children aged 7 and above. Build confidence, improve communication, and develop creativity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6">
                <Button size="lg" className="bg-[#BF420C] hover:bg-[#BF420C]/90 text-white font-bold text-lg px-8 rounded-lg fun-shadow h-14"
                  onClick={() => navigate('REGISTER_STUDENT')}>
                  🚀 Join Now
                </Button>
                <Button size="lg" className="bg-white hover:bg-gray-100 text-[#8b4eaa] font-bold text-lg px-8 rounded-lg fun-shadow h-14"
                  onClick={() => navigate('DEMO')}>
                  🎯 Book a Free Demo
                </Button>
              </div>
            </div>
            <div className="flex-1 max-w-md lg:max-w-2xl w-full mx-auto relative z-10">
              <Image
                src="/hero-kids-v2.jpg"
                alt=""
                aria-hidden="true"
                width={1200}
                height={800}
                priority
                className="w-full h-auto rounded-3xl shadow-2xl hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* ── Highlights ── */}
        <section className="max-w-5xl mx-auto -mt-8 px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📅', title: '4 Classes Weekly', desc: 'Consistent learning schedule to build skills steadily' },
              { icon: '💻', title: '100% Online', desc: 'Learn from the comfort of your home, anywhere in India' },
              { icon: '🎯', title: 'Interactive & Fun', desc: 'Engaging activities, games & live sessions that kids love' },
            ].map((h) => (
              <Card key={h.title} className="card-hover fun-shadow p-6 text-center border-none">
                <span className="text-4xl">{h.icon}</span>
                <h3 className="mt-3 font-bold text-lg">{h.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{h.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Courses Section ── */}
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-4">
              <Skeleton className="h-[500px] w-full rounded-2xl" />
              <Skeleton className="h-[500px] w-full rounded-2xl" />
              <Skeleton className="h-[500px] w-full rounded-2xl" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No courses available at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-4">
              {courses.map((course: any, idx: number) => {
                const COURSE_STYLES = [
                  {
                    gradient: 'from-purple-700 via-violet-700 to-fuchsia-700',
                    iconEmoji: '✍️',
                    IconComp: PenTool,
                      imgSrc: '/illustrations/storytelling.jpg',
                    badgeClass: 'bg-purple-100 text-purple-800',
                    btnClass: 'from-purple-700 to-violet-800 hover:from-purple-800 hover:to-violet-900'
                  },
                  {
                    gradient: 'from-amber-700 via-orange-700 to-red-700',
                    iconEmoji: '🗣️',
                    IconComp: Mic,
                    imgSrc: '/illustrations/user_img1.jpg',
                    badgeClass: 'bg-orange-100 text-orange-800',
                    btnClass: 'from-orange-700 to-red-800 hover:from-orange-800 hover:to-red-900'
                  },
                  {
                    gradient: 'from-green-700 via-emerald-700 to-teal-700',
                    iconEmoji: '📖',
                    IconComp: BookOpen,
                      imgSrc: '/illustrations/user_img2.jpg',
                    badgeClass: 'bg-green-100 text-green-800',
                    btnClass: 'from-green-700 to-emerald-800 hover:from-green-800 hover:to-emerald-900'
                  }
                ];
                const style = COURSE_STYLES[idx % COURSE_STYLES.length];
                const Icon = style.IconComp;

                let topics: string[] = [];
                try {
                  topics = typeof course.topics === 'string' ? JSON.parse(course.topics) : (course.topics || []);
                } catch (e) {}

                return (
                  <Card key={course.id || idx} className={`card-hover fun-shadow overflow-hidden border-none group flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards delay-${idx * 150}`}>
                    <div className={`bg-gradient-to-br ${style.gradient} p-6 md:p-8 text-white relative overflow-hidden`}>
                      <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">{style.iconEmoji}</div>
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold">{course.title || course.name}</h3>
                        <p className="text-white text-sm mt-2 font-medium">{course.tagline || course.description}</p>
                      </div>
                    </div>
                    <CardContent className="p-6 md:p-8 space-y-5 flex flex-col flex-1">
                      <div className="w-full h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                        <img src={style.imgSrc} alt="" aria-hidden="true" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topics.map(t => (
                          <Badge key={t} variant="secondary" className={`${style.badgeClass} text-xs border-none font-medium px-3 py-1`}>{t}</Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 font-medium pt-2 pb-4">
                        Age 7-15 • 4 classes/week • Live online sessions
                      </p>
                      <Button className={`w-full bg-gradient-to-r ${style.btnClass} text-white font-semibold mt-auto`}
                        onClick={() => navigate('COURSES')}>
                        Explore Course <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Leadership & Experience Section ── */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-purple-100 text-purple-800 border-purple-200">Leadership</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Leadership & Experience</h2>
              <p className="text-gray-800 mt-3 max-w-xl mx-auto text-sm">Guided by experienced professionals dedicated to nurturing the next generation of confident communicators.</p>
            </div>
            <div className="flex justify-center mb-10">
              <img src="/illustrations/creativity.png" alt="" aria-hidden="true" className="w-48 h-48 md:w-64 md:h-64 object-contain" loading="lazy" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Founder & Chairman */}
              <Card className="fun-shadow border-none overflow-hidden md:col-span-1 group">
                <div className="bg-pink-600 p-5 text-white text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 ring-4 ring-white/30">
                    <GraduationCap className="w-9 h-9" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white">Founder & Chairman</p>
                </div>
                <CardContent className="p-6 text-center space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">D. Vijaya Lakshmi</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">M.A., M.B.A. (HR), Ph.D.</p>
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">21+ Years of Experience</span>
                  </div>
                </CardContent>
              </Card>

              {/* Managing Director */}
              <Card className="fun-shadow border-none overflow-hidden group">
                <div className="bg-gradient-to-br from-purple-700 to-violet-800 p-5 text-white text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 ring-4 ring-white/30">
                    <Lightbulb className="w-9 h-9" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white">Managing Director</p>
                  <p className="text-xl font-bold mt-1 text-white">Naga Srivalli T</p>
                </div>
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">B.Tech., M.C.A.</p>
                </CardContent>
              </Card>

              {/* Executive Director */}
              <Card className="fun-shadow border-none overflow-hidden group">
                <div className="bg-gradient-to-br from-orange-700 to-rose-800 p-5 text-white text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 ring-4 ring-white/30">
                    <Target className="w-9 h-9" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white">Executive Director</p>
                  <p className="text-xl font-bold mt-1 text-white">Avinash Tavva</p>
                </div>
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">B.Tech., M.B.A.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Pricing Section ── */}
        <section className="bg-gray-50 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600 text-sm md:text-base">Affordable pricing for quality education</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl gap-8 mx-auto justify-center px-4">
              
              {/* Weekly Plan */}
              <Card className="text-center p-8 border border-gray-200 shadow-sm rounded-xl flex flex-col items-center bg-white relative">
                <div className="mb-4 text-4xl">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Weekly Plan</h3>
                <div className="mb-2">
                  <span className="text-5xl font-extrabold text-gray-900">₹{Number(settings.weeklyFee).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-8">per week</p>
                
                <ul className="text-sm text-gray-600 space-y-3 text-left w-full max-w-[200px] mx-auto mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> 4 Online Classes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Learning Materials</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Activities</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Quizzes</li>
                </ul>
                
                <div className="mt-auto w-full">
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-md py-6"
                    onClick={() => navigate('REGISTER_STUDENT')}>Enroll Now</Button>
                </div>
              </Card>

              {/* Monthly Plan */}
              <Card className="text-center p-8 border-2 border-orange-700 shadow-md rounded-xl flex flex-col items-center bg-white relative mt-4 md:mt-0">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                  ⭐ BEST VALUE
                </div>
                
                <div className="mb-4 text-4xl mt-2">📅</div>
                <h3 className="text-xl font-bold text-orange-700 mb-2">Monthly Plan</h3>
                <div className="mb-2">
                  <span className="text-5xl font-extrabold text-orange-700">₹{Number(settings.monthlyFee).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-8">per month</p>
                
                <ul className="text-sm text-gray-600 space-y-3 text-left w-full max-w-[200px] mx-auto mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> 16 Online Classes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Learning Materials</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Activities & Quizzes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Progress Tracking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 font-bold" /> Certificate on Completion</li>
                </ul>
                
                <div className="mt-auto w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md py-6"
                    onClick={() => navigate('REGISTER_STUDENT')}>Enroll Now</Button>
                </div>
              </Card>

            </div>
          </div>
        </section>

        {/* ── Benefits Section ── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-purple-100 text-purple-800">⭐ Benefits</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Your Child Will Gain</h2>
          </div>
          <div className="flex justify-center mb-10">
            <img src="/illustrations/learning.png" alt="" aria-hidden="true" className="w-64 h-64 md:w-80 md:h-80 object-contain" loading="lazy" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'Better Communication','Confidence','Creativity','Public Speaking',
              'Writing Skills','Leadership','Presentation Skills','Vocabulary',
              'Teamwork','Critical Thinking','Stage Confidence','Self-Expression',
            ].map(b => (
              <div key={b} className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700">{b}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials Section ── */}
        <section className="bg-gray-100 py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-purple-100 text-purple-800">💬 Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What Parents Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Priya Sharma', child: 'Aarav, Age 10', text: 'My son used to be shy and hesitant to speak up. After just 2 months at Srivalli School, he confidently presented at his school assembly! The transformation is amazing. 🌟', rating: 5 },
                { name: 'Rajesh Kumar', child: 'Ananya, Age 12', text: 'The content writing course helped my daughter discover her love for storytelling. She now writes her own blog and her vocabulary has improved tremendously! ✍️', rating: 5 },
                { name: 'Lakshmi Reddy', child: 'Rohan, Age 9', text: 'Best investment we made for our child. The teachers are patient, the classes are interactive, and Rohan looks forward to every single session. Highly recommend! 💯', rating: 5 },
              ].map(t => (
                <Card key={t.name} className="card-hover fun-shadow p-6 border-none">
                  <div className="flex gap-1 mb-3">{Array.from({length:t.rating}).map((_,i)=>(
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                  ))}</div>
                  <p className="text-sm text-gray-600 italic mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-gray-600">Parent of {t.child}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌸</span>
                <span className="text-xl font-extrabold tracking-tight"><span className="sr-only">Srivalli Smartspeak</span><span aria-hidden="true">SRIVALLI SMARTSPEAK</span></span>
              </div>
              <p className="text-gray-300 text-sm">Speak Clearly • Think Creatively • Shine Confidently</p>
            </div>
            <div>
              <h2 className="font-bold mb-4 text-lg">Quick Links</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                {(['About','Courses','Contact','DEMO'] as const).map(l => (
                  <li key={l}>
                    <button onClick={() => navigate(l === 'DEMO' ? 'DEMO' : l.toUpperCase() as Screen)} className="hover:text-white transition-colors">
                      {l === 'DEMO' ? 'Book a Demo' : l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-bold mb-4 text-lg">Contact Us</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 9494552359</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@srivallischool.com</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> India</li>
              </ul>
              <Button size="sm" className="mt-4 bg-green-700 hover:bg-green-800 text-white"
                onClick={() => window.open('https://wa.me/919494552359','_blank')}>
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Us
              </Button>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-2">
            <p>© {new Date().getFullYear()} Srivalli SmartSpeak. All rights reserved.</p>
            <div className="flex gap-4">
              <button className="hover:text-white transition-colors">Instagram</button>
              <button className="hover:text-white transition-colors">Facebook</button>
              <button className="hover:text-white transition-colors">YouTube</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp Button ── */}
      <button
        onClick={() => window.open('https://wa.me/919494552359','_blank')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}

/* ============================================================================
   2. ABOUT PAGE
   ============================================================================ */
export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-purple-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => navigate('HOME')} className="text-white hover:text-white text-sm mb-4 inline-flex items-center gap-1">
← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold">🌸 About Srivalli SmartSpeak</h1>
          <p className="mt-3 text-white text-lg">Speak Clearly • Think Creatively • Shine Confidently</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Mission */}
        <Card className="fun-shadow border-none p-6 md:p-8">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-gray-600 leading-relaxed">
              At <strong>Srivalli SmartSpeak 🌸</strong>, our mission is to help students become
              <strong> confident communicators</strong> and <strong>creative thinkers</strong>. We believe that every
              student has a unique voice waiting to be heard, and our purpose is to help them find it.
              Through our expertly designed programs in Public Speaking and Content Writing, we nurture
              young minds to speak clearly, think creatively, and shine confidently.
            </p>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card className="fun-shadow border-none p-6 md:p-8">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Our Objectives</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-3">
              {[
                'Build strong communication skills from an early age',
                'Foster creativity and self-expression through writing',
                'Develop stage confidence and public speaking abilities',
                'Create a fun, safe, and encouraging learning environment',
                'Prepare children for academic and professional success',
                'Help every child discover their unique potential',
              ].map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-gray-600">{obj}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Values */}
        <Card className="fun-shadow border-none p-6 md:p-8">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Our Values</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Sparkles className="w-5 h-5" />, title: 'Creativity', desc: 'We encourage out-of-the-box thinking and creative expression in every lesson.' },
                { icon: <Shield className="w-5 h-5" />, title: 'Safety', desc: 'A nurturing and supportive environment where every child feels valued.' },
                { icon: <Users className="w-5 h-5" />, title: 'Inclusivity', desc: 'Every child, regardless of background, deserves quality education.' },
                { icon: <Award className="w-5 h-5" />, title: 'Excellence', desc: 'We strive for the highest standards in teaching and student outcomes.' },
              ].map(v => (
                <div key={v.title} className="bg-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1 text-purple-700 font-semibold">
                    {v.icon} {v.title}
                  </div>
                  <p className="text-sm text-gray-600">{v.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Ready to give your child the best start?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-purple-700 text-white font-semibold px-8" onClick={() => navigate('DEMO')}>
              📅 Book a Free Demo
            </Button>
            <Button variant="outline" className="font-semibold px-8" onClick={() => navigate('COURSES')}>
              📚 View Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. COURSES PAGE
   ============================================================================ */
export function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackActivity('Course Viewed', 'all', 'All Courses Overview');
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        const fetchedCourses = data.courses || data || [];
        setCourses(fetchedCourses.filter((c: any) => c.isActive));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-purple-700 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center">
          <div className="flex-1">
            <button onClick={() => navigate('HOME')} className="text-white hover:text-white text-sm mb-4 inline-flex items-center gap-1">
← Back to Home
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold">📚 Our Courses</h1>
            <p className="mt-3 text-white text-lg">Comprehensive programs designed for young learners</p>
          </div>
          <div className="w-40 h-40 md:w-48 md:h-48 shrink-0">
            <img src="/illustrations/learning.png" alt="" aria-hidden="true" className="w-full h-full object-contain" loading="eager" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded-2xl" />
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded-2xl" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-lg">No courses available at the moment.</div>
        ) : (
          courses.map((course, idx) => {
            const isAlternate = idx % 2 !== 0;
            const bgClass = isAlternate ? "bg-orange-600" : "bg-purple-700";
            const iconColor = isAlternate ? "text-orange-200" : "text-purple-200";

            let topics: string[] = [];
            try {
              topics = typeof course.topics === 'string' ? JSON.parse(course.topics) : (course.topics || []);
            } catch (e) {}
            if (!topics.length && course.features) {
              topics = course.features;
            }

            return (
              <Card key={course.id} className="fun-shadow overflow-hidden border-none">
                <div className={`${bgClass} p-6 md:p-8 text-white`}>
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">{course.title || course.name}</h2>
                  </div>
                  <p className="text-white text-lg">{course.tagline || course.description || course.category}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <Badge className="bg-black/20 text-white border-white/20 text-lg py-1 px-3">₹{Number(course.monthlyFee || course.fee || 0).toLocaleString()}/month</Badge>
                  </div>
                </div>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BookOpen className={`w-5 h-5 ${iconColor}`} /> What You'll Learn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topics.map((t: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800">
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className={`${isAlternate ? 'bg-orange-600' : 'bg-purple-700'} text-white font-semibold px-8`} onClick={() => {
                    trackActivity('Enrollment Started', course.id, course.title || course.name);
                    navigate('REGISTER_STUDENT');
                  }}>
                    View Course / Enroll <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   4. CONTACT PAGE
   ============================================================================ */
export function ContactPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentName: contactForm.name, mobile: contactForm.phone, courseInterest: 'General Inquiry', message: contactForm.message }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast('Message sent successfully! We will get back to you soon. 🥳');
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-teal-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => navigate('HOME')} className="text-white hover:text-white text-sm mb-4 inline-flex items-center gap-1">
← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold">📞 Contact Us</h1>
          <p className="mt-3 text-white text-lg">We'd love to hear from you!</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: <Phone className="w-6 h-6" />, label: 'Phone', value: '+91 9494552359', color: 'bg-pink-600' },
              { icon: <MessageCircle className="w-6 h-6" />, label: 'WhatsApp', value: '+91 9494552359', color: 'bg-green-700', action: () => window.open('https://wa.me/919494552359','_blank') },
              { icon: <Mail className="w-6 h-6" />, label: 'Email', value: 'hello@srivallischool.com', color: 'bg-orange-600' },
              { icon: <Clock className="w-6 h-6" />, label: 'Working Hours', value: 'Mon-Sat: 9 AM - 7 PM IST', color: 'bg-teal-700' },
              { icon: <MapPin className="w-6 h-6" />, label: 'Location', value: 'India (Online Classes)', color: 'bg-purple-700' },
            ].map(c => (
              <Card key={c.label} className="fun-shadow border-none p-4 flex items-center gap-4 cursor-pointer card-hover"
                onClick={'action' in c ? c.action : undefined}>
                <div className={`w-12 h-12 rounded-full ${c.color} flex items-center justify-center text-white shrink-0`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{c.label}</p>
                  <p className="font-medium text-gray-800">{c.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="fun-shadow border-none p-6 md:p-8">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-2xl">Send Us a Message ✉️</CardTitle>
              <CardDescription>Fill out the form and we'll get back to you within 24 hours.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your Name</Label>
                  <Input id="contact-name" placeholder="Enter your name" required
                    value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <Input id="contact-email" type="email" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" placeholder="you@example.com"
                      required className="pl-10 h-12 border-gray-300 focus:ring-purple-600" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input id="contact-phone" type="tel" placeholder="+91 XXXXXXXXXX" required
                    value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-msg">Message</Label>
                  <Textarea id="contact-msg" placeholder="How can we help you?" rows={4} required
                    value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-teal-700 text-white font-semibold" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'} <Send className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map Placeholder */}
        <div className="mt-12 rounded-2xl overflow-hidden border border-gray-200 h-64 bg-teal-50 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Globe className="w-12 h-12 mx-auto mb-2" />
            <p className="font-semibold">100% Online — Learn from Anywhere in India! 🇮🇳</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. DEMO PAGE
   ============================================================================ */
export function DemoPage() {
  useEffect(() => {
    trackActivity('Demo Started', 'none', 'Demo Booking Page');
  }, []);

  const [form, setForm] = useState({
    parentName: '', childName: '', childAge: '', mobile: '',
    preferredDate: '', preferredTime: '', courseInterest: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      
      trackActivity('Demo Booked', form.courseInterest, form.courseInterest, { date: form.preferredDate, time: form.preferredTime });

      addToast('Demo request submitted successfully! 🥳 We will contact you shortly.');
      setForm({ parentName: '', childName: '', childAge: '', mobile: '', preferredDate: '', preferredTime: '', courseInterest: '' });
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm(prev => ({...prev, [field]: value}));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-purple-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => navigate('HOME')} className="text-white hover:text-white text-sm mb-4 inline-flex items-center gap-1">
← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold">📅 Book a Free Demo</h1>
          <p className="mt-3 text-white text-lg">Experience a class before you enroll — completely free!</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="fun-shadow border-none p-6 md:p-8">
          <CardHeader className="p-0 pb-6">
            <div className="text-center">
              <span className="text-4xl">🎓</span>
              <CardTitle className="text-2xl mt-2">Register for a Free Demo Class</CardTitle>
              <CardDescription className="mt-1">Fill in the details below and we'll schedule a free trial class for your child.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-parent">Parent's Name *</Label>
                  <Input id="demo-parent" placeholder="Your full name" required value={form.parentName} onChange={e => update('parentName', e.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-child">Child's Name *</Label>
                  <Input id="demo-child" placeholder="Your child's name" required value={form.childName} onChange={e => update('childName', e.target.value)} autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-age">Child's Age *</Label>
                  <Input id="demo-age" type="number" placeholder="e.g. 10" required value={form.childAge} onChange={e => update('childAge', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-mobile">Mobile Number *</Label>
                  <Input id="demo-mobile" type="tel" placeholder="+91 XXXXXXXXXX" required value={form.mobile} onChange={e => update('mobile', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-date">Preferred Date *</Label>
                  <Input id="demo-date" type="date" required value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-time">Preferred Time *</Label>
                  <Select required value={form.preferredTime} onValueChange={v => update('preferredTime', v)}>
                    <SelectTrigger id="demo-time"><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {['10:00 AM','11:00 AM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Course Interest *</Label>
                <Select required value={form.courseInterest} onValueChange={v => update('courseInterest', v)}>
                  <SelectTrigger aria-label="Select Course Interest"><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Content Writing">✍️ Content Writing</SelectItem>
                    <SelectItem value="Public Speaking">🎤 Public Speaking</SelectItem>
                    <SelectItem value="Storytelling">📖 Storytelling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-pink-600 text-white font-semibold text-base py-6" disabled={loading}>
                {loading ? 'Submitting...' : '🥳 Book My Free Demo'}
              </Button>
              <p className="text-center text-xs text-gray-500">No payment required. 100% free trial class.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================================
   6. LOGIN PAGE
   ============================================================================ */
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', role: 'student' as string });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ role: form.role }),
      });
      if (!res.ok) {
        await auth.signOut();
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid credentials or wrong role selected');
      }
      const data = await res.json();
      useAppStore.getState().login(data.user, cred.user, idToken);
      addToast(`Welcome back, ${data.user.name}! 🥳`);
    } catch (err: unknown) {
      console.error('[Diagnostic] Firebase Auth/Login Error:', err);
      const fbErr = err as { code?: string, message?: string };
      let userMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      switch (fbErr.code) {
        case 'auth/network-request-failed':
          userMessage = 'Unable to connect to the authentication service. Please check your internet connection and try again.';
          break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          userMessage = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          userMessage = 'This account has been disabled. Please contact support.';
          break;
      }
      addToast(userMessage, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8">
        <div className="hidden md:flex flex-1 justify-center">
          <img src="/illustrations/creativity.png" alt="" aria-hidden="true" className="w-72 h-72 object-contain" loading="eager" />
        </div>
        <Card className="w-full max-w-md fun-shadow border-none p-6 md:p-8">
        <div className="text-center mb-6">
          <button onClick={() => navigate('HOME')} className="text-gray-600 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1">
            ← Home
          </button>
          <span className="text-5xl">🌸</span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-2">Welcome Back!</h1>
          <p className="text-gray-500 text-sm mt-1">Login to your Srivalli School account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
              <SelectTrigger aria-label="Select Role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">🎓 Student</SelectItem>
                <SelectItem value="parent">👨‍👩‍👧 Parent</SelectItem>
                <SelectItem value="teacher">👩‍🏫 Teacher</SelectItem>
                <SelectItem value="admin">🔧 Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email or Mobile</Label>
            <Input id="login-email" placeholder="you@example.com or mobile" required
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-pass">Password</Label>
            <Input id="login-pass" type="password" placeholder="Enter your password" required
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>Don't have an account?</p>
          <div className="flex gap-3 justify-center">
            <Button variant="link" className="text-pink-600 p-0" onClick={() => navigate('REGISTER_STUDENT')}>Register as Student</Button>
            <span className="text-gray-300">|</span>
            <Button variant="link" className="text-purple-600 p-0" onClick={() => navigate('REGISTER_PARENT')}>Register as Parent</Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}

/* ============================================================================
   7. REGISTER STUDENT PAGE
   ============================================================================ */
export function RegisterStudentPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', dateOfBirth: '', age: '',
    gender: '', grade: '', schoolName: '', parentName: '', parentMobile: '',
    city: '', state: '', preferredClassDays: '', preferredClassTime: '', courseSelection: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'student' }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Registration failed'); }
      addToast('Registration successful! Please login to continue. 🥳');
      navigate('LOGIN');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Registration failed. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm(prev => ({...prev, [field]: value}));

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl flex flex-col md:flex-row-reverse items-center gap-8">
        <div className="hidden md:flex flex-1 justify-center">
          <img src="/illustrations/speaking.png" alt="" aria-hidden="true" className="w-72 h-72 object-contain" loading="eager" />
        </div>
        <Card className="w-full max-w-2xl fun-shadow border-none p-6 md:p-8">
          <div className="text-center mb-6">
            <button onClick={() => navigate('HOME')} className="text-gray-600 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1">
              ← Home
            </button>
            <span className="text-5xl">🎓</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">Student Registration</h1>
            <p className="text-gray-500 text-sm mt-1">Join Srivalli School and start learning!</p>
          </div>
        <form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-name">Full Name *</Label>
                <Input id="rs-name" placeholder="Student's full name" required value={form.name} onChange={e => update('name', e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-email">Student Email</Label>
              <Input id="rs-email" type="email" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" placeholder="student@example.com" required value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-pass">Password *</Label>
              <Input id="rs-pass" type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-dob">Date of Birth *</Label>
              <Input id="rs-dob" type="date" required value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-age">Age *</Label>
              <Input id="rs-age" type="number" placeholder="e.g. 10" required value={form.age} onChange={e => update('age', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select required value={form.gender} onValueChange={v => update('gender', v)}>
                <SelectTrigger aria-label="Select Gender"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-grade">Grade *</Label>
              <Select required value={form.grade} onValueChange={v => update('grade', v)}>
                <SelectTrigger aria-label="Select Grade"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Array.from({length:9}, (_,i) => i+2).map(g => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-school">School Name</Label>
              <Input id="rs-school" placeholder="Current school name" value={form.schoolName} onChange={e => update('schoolName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-pname">Parent's Name *</Label>
              <Input id="rs-pname" placeholder="Parent or guardian name" required value={form.parentName} onChange={e => update('parentName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-pmobile">Parent's Mobile *</Label>
              <Input id="rs-pmobile" type="tel" placeholder="+91 XXXXXXXXXX" required value={form.parentMobile} onChange={e => update('parentMobile', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-city">City *</Label>
              <Input id="rs-city" placeholder="Your City" required value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-state">State *</Label>
              <Input id="rs-state" placeholder="Your State" required value={form.state} onChange={e => update('state', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-course">Course Selection *</Label>
              <Select required value={form.courseSelection} onValueChange={v => update('courseSelection', v)}>
                <SelectTrigger aria-label="Select Course"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Content Writing">✍️ Content Writing</SelectItem>
                  <SelectItem value="Public Speaking">🎤 Public Speaking</SelectItem>
                  <SelectItem value="Storytelling">📖 Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-days">Preferred Class Days</Label>
              <Input id="rs-days" placeholder="e.g. Weekends, Mon-Wed" value={form.preferredClassDays} onChange={e => update('preferredClassDays', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-time">Preferred Class Time</Label>
              <Input id="rs-time" placeholder="e.g. 4 PM - 6 PM" value={form.preferredClassTime} onChange={e => update('preferredClassTime', e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-purple-700 text-white font-semibold text-base py-6" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Student'}
          </Button>
        </form>
      </Card>
    </div>
  </div>
  );
}

/* ============================================================================
   8. REGISTER PARENT PAGE
   ============================================================================ */
export function RegisterParentPage() {
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '',
    city: '', state: '', childName: '', childAge: '',
    childGrade: '', courseInterest: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'parent' }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Registration failed'); }
      addToast('Registration successful! Please login to continue. 🥳');
      navigate('LOGIN');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Registration failed. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm(prev => ({...prev, [field]: value}));

  return (
    <div className="min-h-screen bg-gradient-to-br from-srivalli-light-purple to-srivalli-light-pink flex items-center justify-center px-4 py-12 outline-none">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8">
        <div className="hidden md:flex flex-1 justify-center">
          <img src="/illustrations/writing.png" alt="" aria-hidden="true" className="w-72 h-72 object-contain" loading="eager" />
        </div>
        <Card className="w-full max-w-2xl fun-shadow border-none p-6 md:p-8">
          <div className="text-center mb-6">
            <button onClick={() => navigate('HOME')} className="text-gray-600 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1">
              ← Home
            </button>
            <span className="text-5xl">👩‍👩‍👧</span>
          <h1 className="text-2xl font-extrabold text-gradient mt-2">Parent Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create an account to manage your child&apos;s learning journey!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-name">Your Full Name *</Label>
                <Input id="rp-name" placeholder="Your full name" required value={form.name} onChange={e => update('name', e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-mobile">Mobile Number *</Label>
                <Input id="rp-mobile" type="tel" placeholder="+91 XXXXXXXXXX" required value={form.mobile} onChange={e => update('mobile', e.target.value)} autoComplete="tel" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-email">Email *</Label>
              <Input id="rp-email" type="email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" placeholder="parent@example.com" required value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-pass">Password *</Label>
              <Input id="rp-pass" type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-city">City *</Label>
              <Input id="rp-city" placeholder="Your city" required value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-state">State *</Label>
              <Input id="rp-state" placeholder="Your state" required value={form.state} onChange={e => update('state', e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Child&apos;s Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-child">Child&apos;s Name *</Label>
              <Input id="rp-child" placeholder="Your child's name" required value={form.childName} onChange={e => update('childName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-cage">Child&apos;s Age *</Label>
              <Input id="rp-cage" type="number" placeholder="e.g. 10" required value={form.childAge} onChange={e => update('childAge', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Child&apos;s Grade *</Label>
              <Select required value={form.childGrade} onValueChange={v => update('childGrade', v)}>
                <SelectTrigger aria-label="Select Child Grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {Array.from({length:9}, (_,i) => i+2).map(g => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course Interest *</Label>
              <Select required value={form.courseInterest} onValueChange={v => update('courseInterest', v)}>
                <SelectTrigger aria-label="Select Course Interest"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Content Writing">✍️ Content Writing</SelectItem>
                  <SelectItem value="Public Speaking">🎤 Public Speaking</SelectItem>
                  <SelectItem value="Storytelling">📖 Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full gradient-pink border border-[#c2185b] text-white font-semibold text-base py-6" disabled={loading}>
            {loading ? 'Creating Account...' : '👨‍👩‍👧 Create Parent Account'}
          </Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Button variant="link" className="text-srivalli-pink p-0" onClick={() => navigate('LOGIN')}>Login here</Button>
          </p>
        </form>
      </Card>
      </div>
    </div>
  );
}
