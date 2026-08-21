import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// During SSR/prerender (build time), Firebase env vars may not be available.
// Use a safe placeholder so the build doesn't crash.
// At runtime in the browser, real env vars are always inlined by Next.js.
const isServer = typeof window === 'undefined';

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only in the browser (avoid SSR issues)
let app: FirebaseApp | undefined;
if (!isServer) {
  if (!firebaseClientConfig.apiKey || !firebaseClientConfig.projectId) {
    console.error("Firebase Configuration Error: Missing required environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID).");
  }
  app = getApps().length === 0 ? initializeApp(firebaseClientConfig as any) : (getApps()[0] as FirebaseApp);
}

export const auth: Auth = isServer ? ({} as Auth) : getAuth(app!);
export const db: Firestore = isServer ? ({} as Firestore) : getFirestore(app!);
export const storage = isServer ? ({} as ReturnType<typeof getStorage>) : getStorage(app);
export default app;