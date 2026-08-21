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

const cwTopics = [
  '✍️ Creative Writing', '📖 Storytelling', '📝 Story Writing', '💡 Imagination',
  '🔤 Vocabulary Building', '📚 Sentence Formation', '🎨 Picture Writing', '🧩 Complete the Story',
  '👤 Character Creation', '📄 Paragraph Writing', '📕 Essay Writing', '✉️ Letter Writing',
  '🌟 Descriptive Writing', '🎭 Creative Expression', '📰 Basic Blogging', '🎤 Speech Writing',
  '🖼️ Poster Writing', '🔎 Editing & Proofreading', '🏆 Writing Challenges'
];

const stTopics = [
  '📖 Story Creation', '🧚 Character Building', '💡 Imagination & Creativity', '🎭 Role Play',
  '🗣️ Story Narration', '🖼️ Picture-Based Stories', '🔄 Complete the Story', '✨ Creative Storytelling',
  '🎵 Voice & Expression', '😊 Emotions in Stories', '🧩 Story Sequencing', '🌍 Moral Stories',
  '🏆 Storytelling Challenges', '🎤 Story Presentation'
];

async function updateTopics() {
  const cwId = 'eavKpuNSfJvkbIZUnUmi'; // Content Writing
  const stId = 'demo-course-storytelling'; // Storytelling
  
  await db.collection('courses').doc(cwId).update({
    topics: JSON.stringify(cwTopics),
    features: cwTopics
  });
  
  await db.collection('courses').doc(stId).update({
    topics: JSON.stringify(stTopics),
    features: stTopics
  });
  
  console.log('Successfully updated topics for Content Writing and Storytelling!');
}

updateTopics().catch(console.error);
