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

async function cleanCourses() {
  const snapshot = await db.collection('courses').get();
  const courses: any[] = [];
  snapshot.forEach(doc => courses.push({ id: doc.id, ...doc.data() }));

  console.log('--- ALL COURSES ---');
  courses.forEach(c => console.log(`[${c.id}] ${c.title || c.name} (isActive: ${c.isActive})`));

  // Find duplicates and combos
  const toDelete: string[] = [];
  const kept = new Set<string>();
  
  for (const c of courses) {
    const name = c.title || c.name;
    if (!name) continue;

    if (name.includes('Combo')) {
      console.log(`Marking Combo for deletion: ${c.id}`);
      toDelete.push(c.id);
    } else if (name.includes('Content Writing') || name.includes('Public Speaking')) {
      if (kept.has(name)) {
        console.log(`Marking duplicate for deletion: ${c.id} (${name})`);
        toDelete.push(c.id);
      } else {
        kept.add(name);
      }
    }
  }

  for (const id of toDelete) {
    await db.collection('courses').doc(id).delete();
    console.log(`Deleted ${id}`);
  }
}

cleanCourses().catch(console.error);
