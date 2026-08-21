import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function decodeKey(): string {
  // Try base64-encoded key first (bypasses Vercel redaction)
  if (process.env.FIREBASE_PRIVATE_KEY_B64) {
    return Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
  }
  // Fallback to raw key
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
}

function init() {
  if (_app) return;
  const privateKey = decodeKey();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!privateKey || !clientEmail || !projectId) {
    throw new Error('Missing Firebase Admin SDK environment variables.');
  }
  _app = getApps().length === 0
    ? initializeApp({
        credential: cert({ privateKey, clientEmail, projectId }),
        storageBucket: `${projectId}.firebasestorage.app`,
      })
    : getApps()[0];
  _auth = getAuth(_app);
  _db = getFirestore(_app);
}

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop, receiver) {
    const inst = (init(), _db)!;
    const val = Reflect.get(inst, prop, receiver);
    return typeof val === 'function' ? val.bind(inst) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop, receiver) {
    const inst = (init(), _auth)!;
    const val = Reflect.get(inst, prop, receiver);
    return typeof val === 'function' ? val.bind(inst) : val;
  },
});

export default new Proxy({} as App, {
  get(_, prop, receiver) {
    const inst = (init(), _app)!;
    const val = Reflect.get(inst, prop, receiver);
    return typeof val === 'function' ? val.bind(inst) : val;
  },
});