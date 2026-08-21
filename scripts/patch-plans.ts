import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let app;
try {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'srivalli-school-firebase-adminsdk-fbsvc-12a20df797.json');
  if (existsSync(saPath)) {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
    app = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApps()[0];
  } else {
    const envFile = readFileSync('.env.local', 'utf-8');
    const env: any = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
      }
    });

    let privateKey = env['FIREBASE_PRIVATE_KEY'] || '';
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/`n/g, '\n');

    app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || env['FIREBASE_PROJECT_ID'],
            clientEmail: env['FIREBASE_CLIENT_EMAIL'],
            privateKey,
          }),
        })
      : getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1);
}

const db = getFirestore(app);

async function patch() {
  console.log('Patching courses with plan details...');
  
  await db.collection('courses').doc('demo-course-cw').set({
    name: 'Content Writing',
    title: 'Content Writing for Kids',
    fee: 4000,
    duration: 'Month',
    features: [
      'Interactive Live Sessions',
      'Creative Assignments',
      'Personalized Feedback',
      'Vocabulary Building'
    ],
    isActive: true
  }, { merge: true });

  await db.collection('courses').doc('demo-course-ps').set({
    name: 'Public Speaking',
    title: 'Public Speaking for Kids',
    fee: 5000,
    duration: 'Month',
    features: [
      'Confidence Building',
      'Body Language Basics',
      'Debate Sessions',
      'Live Speeches'
    ],
    isActive: true
  }, { merge: true });
  
  // Create a third plan if the user wants to see 3 plans as the UI fits 3 best
  await db.collection('courses').doc('demo-course-combo').set({
    name: 'Combo Course',
    title: 'Writing + Speaking Combo',
    fee: 7500,
    duration: 'Month',
    features: [
      'Both Writing & Speaking Classes',
      'All Premium Materials',
      'Priority Teacher Support',
      'Advanced Certificates'
    ],
    category: 'Combo',
    isActive: true
  }, { merge: true });

  console.log('Done!');
}

patch().catch(console.error);
