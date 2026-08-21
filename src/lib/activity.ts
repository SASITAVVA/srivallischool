import { useAppStore } from './store';

// A simple session ID for anonymous users (persists for the browser session)
let sessionId = '';
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('ss_activity_session') || '';
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('ss_activity_session', sessionId);
  }
}

// Simple debouncer to prevent excessive duplicate tracking
const lastTracked = new Map<string, number>();

export async function trackActivity(eventType: string, courseId?: string, courseName?: string, metadata?: Record<string, unknown>) {
  // Prevent duplicate events within 5 seconds
  const dedupeKey = `${eventType}_${courseId || 'all'}`;
  const now = Date.now();
  if (lastTracked.has(dedupeKey) && now - lastTracked.get(dedupeKey)! < 5000) {
    return; // Skip duplicate
  }
  lastTracked.set(dedupeKey, now);

  try {
    const { firebaseUser } = useAppStore.getState();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fire and forget (do not block execution)
    fetch('/api/activity', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventType,
        courseId,
        courseName,
        sessionId,
        metadata
      }),
    }).catch(() => {
      // Ignore network errors for tracking
    });
  } catch {
    // Ignore any tracking errors
  }
}
