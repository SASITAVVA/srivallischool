require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

function decodeKey() {
  if (process.env.FIREBASE_PRIVATE_KEY_B64) {
    return Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
  }
  return (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/`n/g, '\n');
}

const privateKey = decodeKey();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ privateKey, clientEmail, projectId })
  });
}

const db = admin.firestore();

async function seedStorytelling() {
  const coursesRef = db.collection('courses');
  const snapshot = await coursesRef.where('title', '==', 'Storytelling').get();
  
  if (!snapshot.empty) {
    console.log("Storytelling course already exists.");
    process.exit(0);
  }

  const courseData = {
    title: "Storytelling",
    description: "Master the art of storytelling through creativity, imagination, and expression. This course helps children build confidence and communication skills.",
    tagline: "Unleash your imagination and voice!",
    weeklyFee: 500,
    monthlyFee: 1800,
    duration: "3 months",
    category: "creative",
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    topics: [
      "Story Creation",
      "Character Building",
      "Imagination & Creativity",
      "Role Play",
      "Story Narration",
      "Picture-Based Stories",
      "Complete the Story",
      "Creative Storytelling",
      "Voice & Expression",
      "Emotions in Stories",
      "Story Sequencing",
      "Moral Stories",
      "Storytelling Challenges",
      "Story Presentation"
    ],
    activities: [
      "Live story narration",
      "Role-playing games",
      "Group discussions",
      "Picture description"
    ]
  };

  await coursesRef.add(courseData);
  console.log("Storytelling course added successfully!");
  process.exit(0);
}

seedStorytelling().catch(console.error);
