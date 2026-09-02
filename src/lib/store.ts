import { create } from 'zustand';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export type Screen =
  | 'HOME'
  | 'ABOUT'
  | 'COURSES'
  | 'CONTACT'
  | 'DEMO'
  | 'LOGIN'
  | 'REGISTER_STUDENT'
  | 'REGISTER_PARENT'
  | 'STUDENT_DASHBOARD'
  | 'STUDENT_COURSES'
  | 'STUDENT_CLASSES'
  | 'STUDENT_ASSIGNMENTS'
  | 'STUDENT_QUIZZES'
  | 'STUDENT_PROGRESS'
  | 'STUDENT_LEADERBOARD'
  | 'STUDENT_MATERIALS'
  | 'STUDENT_CERTIFICATES'
  | 'STUDENT_PROFILE'
  | 'STUDENT_VIDEO_SUBMISSIONS'
  | 'PARENT_DASHBOARD'
  | 'PARENT_CHILDREN'
  | 'PARENT_CLASSES'
  | 'PARENT_PAYMENTS'
  | 'PARENT_CERTIFICATES'
  | 'TEACHER_DASHBOARD'
  | 'TEACHER_STUDENTS'
  | 'TEACHER_CLASSES'
  | 'TEACHER_ASSIGNMENTS'
  | 'TEACHER_QUIZZES'
  | 'TEACHER_REPORTS'
  | 'TEACHER_COUNSELLING'
  | 'TEACHER_VIDEO_REVIEWS'
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_STUDENTS'
  | 'ADMIN_PARENTS'
  | 'ADMIN_TEACHERS'
  | 'ADMIN_COURSES'
  | 'ADMIN_PAYMENTS'
  | 'ADMIN_REPORTS'
  | 'ADMIN_SETTINGS'
  | 'ADMIN_TEACHER_ASSIGNMENTS'
  | 'ADMIN_DEMO_REQUESTS'
  | 'ADMIN_CERTIFICATES'
  | 'ADMIN_ACTIVITY'
  | 'TEACHER_PROFILE'
  | 'PARENT_PROFILE';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: UserRole;
  firebaseUid?: string;
  [key: string]: unknown;
}

interface AppState {
  screen: Screen;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  sidebarOpen: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  authLoading: boolean;
  
  // Navigation
  navigate: (screen: Screen) => void;
  goBack: () => void;
  history: Screen[];
  
  // Auth
  login: (user: User, firebaseUser?: FirebaseUser | null, idToken?: string | null) => void;
  logout: () => void;
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  setIdToken: (token: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Toast
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'HOME',
  user: null,
  firebaseUser: null,
  idToken: null,
  sidebarOpen: false,
  toasts: [],
  history: ['HOME'],
  authLoading: true,

  navigate: (screen: Screen) => {
    const { history } = get();
    set({ screen, history: [...history, screen] });
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  },

  goBack: () => {
    const { history } = get();
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      set({ screen: newHistory[newHistory.length - 1], history: newHistory });
    }
  },

  login: (user: User, firebaseUser = null, idToken = null) => {
    const role = user.role;
    let defaultScreen: Screen = 'HOME';
    switch (role) {
      case 'student': defaultScreen = 'STUDENT_DASHBOARD'; break;
      case 'parent': defaultScreen = 'PARENT_DASHBOARD'; break;
      case 'teacher': defaultScreen = 'TEACHER_DASHBOARD'; break;
      case 'admin': defaultScreen = 'ADMIN_DASHBOARD'; break;
    }
    set({ user, firebaseUser, idToken, screen: defaultScreen, history: [defaultScreen], authLoading: false });
  },

  logout: () => {
    auth.signOut().catch(() => {});
    set({ user: null, firebaseUser: null, idToken: null, screen: 'HOME', history: ['HOME'], sidebarOpen: false, authLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/'; // Hard redirect to completely flush state and exit protected layouts
    }
  },

  setFirebaseUser: (fbUser: FirebaseUser | null) => set({ firebaseUser: fbUser }),
  setIdToken: (token: string | null) => set({ idToken: token }),
  setAuthLoading: (loading: boolean) => set({ authLoading: loading }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  addToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id: string) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/**
 * Initialize Firebase auth state listener.
 * Call this once in the root layout or page component.
 * On auth state change, if user exists, fetch their profile from /api/auth/login.
 */
export function initAuthListener() {
  if (typeof window === 'undefined') return;
  
  onAuthStateChanged(auth, async (firebaseUser) => {
    const store = useAppStore.getState();
    if (typeof window !== 'undefined' && (window as any).isLoggingIn) return;
    
    if (firebaseUser) {
      store.setFirebaseUser(firebaseUser);
      try {
        const idToken = await firebaseUser.getIdToken();
        store.setIdToken(idToken);
        
        // Fetch user profile with true role derived from our backend
        const res = await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({}),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            store.login(data.user, firebaseUser, idToken);
            return;
          }
        }
        
        // If login endpoint fails (e.g., no profile yet), just set firebase user
        store.setAuthLoading(false);
      } catch {
        store.setAuthLoading(false);
      }
    } else {
      store.setFirebaseUser(null);
      store.setIdToken(null);
      store.setAuthLoading(false);
    }
  });
}

/**
 * Helper to get auth headers for API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { firebaseUser } = useAppStore.getState();
  if (firebaseUser) {
    const idToken = await firebaseUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}