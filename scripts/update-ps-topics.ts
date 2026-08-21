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
    app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
  } else {
    const envFile = readFileSync('.env.local', 'utf-8');
    const env: any = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim(); let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
      }
    });
    let privateKey = env['FIREBASE_PRIVATE_KEY'] || '';
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/`n/g, '\n');
    app = getApps().length === 0 ? initializeApp({
      credential: cert({
        projectId: env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || env['FIREBASE_PROJECT_ID'],
        clientEmail: env['FIREBASE_CLIENT_EMAIL'],
        privateKey,
      }),
    }) : getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1);
}

const db = getFirestore(app);

const topics = [
  '👋 Self-introduction',
  '🗣️ Speaking clearly',
  '🔊 Voice modulation',
  '📖 Pronunciation',
  '👀 Eye contact',
  '🙋 Body language',
  '😊 Facial expressions',
  '🎤 Stage confidence',
  '📚 Storytelling',
  '📝 Speech preparation',
  '🎙️ Presentation skills',
  '💬 Group discussions',
  '⚖️ Debate skills',
  '⚡ Impromptu speaking',
  '🎯 Extempore speaking',
  '🎭 Role plays',
  '🎤 Anchoring',
  '👑 Leadership communication',
  '💼 Basic interview skills'
];

async function updatePSTopics() {
  const courseId = 'yNUZHE09J11DDYlEBl53'; // Public Speaking
  
  await db.collection('courses').doc(courseId).update({
    topics: JSON.stringify(topics),
    features: topics // update features too just in case
  });
  
  console.log('Successfully updated topics for Public Speaking!');
}

updatePSTopics().catch(console.error);
