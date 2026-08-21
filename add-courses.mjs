import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
// Handle both \n and PowerShell `n
privateKey = privateKey.replace(/\\n/g, '\n').replace(/`n/g, '\n');

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function run() {
  const courses = [
    {
      title: 'Content Writing',
      description: 'Learn how to write engaging, high-quality content for blogs, websites, and social media.',
      tagline: 'Master the art of words',
      weeklyFee: 500,
      monthlyFee: 1800,
      duration: '3 Months',
      category: 'Writing',
      topics: ['Blogging', 'Copywriting', 'SEO Writing'],
      activities: ['Drafting Articles', 'Editing', 'Peer Review'],
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      title: 'Public Speaking',
      description: 'Develop confidence and communication skills to speak effectively in front of any audience.',
      tagline: 'Speak with confidence',
      weeklyFee: 600,
      monthlyFee: 2000,
      duration: '4 Months',
      category: 'Communication',
      topics: ['Body Language', 'Speech Structure', 'Overcoming Fear'],
      activities: ['Impromptu Speaking', 'Debate', 'Presentation'],
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
  ];

  console.log('Adding courses...');
  for (const course of courses) {
    const res = await db.collection('courses').add(course);
    console.log(`Added ${course.title} with ID: ${res.id}`);
  }
  console.log('Done!');
}

run().catch(console.error);
