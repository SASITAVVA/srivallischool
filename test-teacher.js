require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    console.log("Signing in as teacher...");
    const cred = await signInWithEmailAndPassword(auth, 'teacher@example.com', 'Password123!');
    const token = await cred.user.getIdToken(true);
    console.log("Got token. Fetching /api/students...");

    const res = await fetch('http://localhost:3000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);

    console.log("Fetching /api/classes...");
    const res2 = await fetch('http://localhost:3000/api/classes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Classes Status: ${res2.status}`);
    console.log(`Classes Response: ${await res2.text()}`);

    console.log("Fetching /api/assignments...");
    const res3 = await fetch('http://localhost:3000/api/assignments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Assignments Status: ${res3.status}`);
    console.log(`Assignments Response: ${await res3.text()}`);

    console.log("Fetching /api/courses...");
    const res4 = await fetch('http://localhost:3000/api/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Courses Status: ${res4.status}`);
    console.log(`Courses Response: ${await res4.text()}`);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
