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

async function addStorytellingCourse() {
  console.log('Adding Storytelling Course...');
  
  await db.collection('courses').doc('demo-course-storytelling').set({
    name: 'Storytelling',
    title: 'Storytelling',
    tagline: 'Stories • Bhagavad Gita • Ramayanam • Moral Values • Poems',
    category: 'Creative',
    isActive: true,
    weeklyFee: 500, // Derived
    monthlyFee: 2000,
    fee: 2000,
    duration: 'Month',
    features: [
      'Stories',
      'Bhagavad Gita Lessons',
      'Ramayanam Events',
      'Moral Values',
      'Poems & Recitation'
    ],
    topics: JSON.stringify([
      'Short & Traditional Stories',
      'Imaginative & Character-based Stories',
      'Story Narration Practice',
      'Bhagavad Gita Teachings & Values',
      'Ramayanam Characters & Events',
      'Moral Stories (Honesty, Courage, Kindness)',
      "Children's Poems & Rhymes",
      'Expression and Voice Modulation'
    ]),
    createdAt: new Date().toISOString()
  }, { merge: true });

  console.log('Storytelling Course successfully added/updated!');
}

addStorytellingCourse().catch(console.error);
