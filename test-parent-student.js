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

const BASE_URL = 'https://srivallischool.com';

async function fetchJson(url, token) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { status: res.status, ok: res.ok, body: await res.text() };
}

async function testFlow() {
  try {
    console.log("==================================================");
    console.log("PART 1 — STUDENT DASHBOARD");
    console.log("==================================================");
    let cred = await signInWithEmailAndPassword(auth, 'student@example.com', 'Password123!');
    let studentUid = cred.user.uid;
    let token = await cred.user.getIdToken(true);
    console.log("Login: SUCCESS");
    console.log("Student UID:", studentUid);
    console.log("Role via token expected: student");

    const studentEndpoints = [
      `/api/enrollments?studentId=${studentUid}`,
      `/api/classes?studentId=${studentUid}`,
      `/api/assignments`,
      `/api/quizzes`,
      `/api/badges?studentId=${studentUid}`,
      `/api/attendance?studentId=${studentUid}`,
      `/api/leaderboard`,
      `/api/certificates?studentId=${studentUid}`
    ];

    for (const ep of studentEndpoints) {
      console.log(`\nFetching ${ep}...`);
      const res = await fetchJson(ep, token);
      console.log(`Status: ${res.status}`);
      let parsed;
      try { parsed = JSON.parse(res.body); } catch(e) {}
      console.log(`Response snippet: ${res.body.slice(0, 150)}...`);
      if (res.status !== 200) console.log(">>> FAILURE: Status != 200");
      else if (!parsed?.success) console.log(">>> FAILURE: success=false");
    }

    console.log("\n==================================================");
    console.log("PART 2 — PARENT DASHBOARD");
    console.log("==================================================");
    cred = await signInWithEmailAndPassword(auth, 'parent@example.com', 'Password123!');
    let parentUid = cred.user.uid;
    token = await cred.user.getIdToken(true);
    console.log("Login: SUCCESS");
    console.log("Parent UID:", parentUid);
    
    // For parent, we first get the parent profile to find linked students
    console.log(`\nFetching /api/parents?id=${parentUid}...`);
    let pRes = await fetchJson(`/api/parents?id=${parentUid}`, token);
    console.log(`Status: ${pRes.status}`);
    let pParsed = {};
    try { pParsed = JSON.parse(pRes.body); } catch(e) {}
    console.log(`Response snippet: ${pRes.body.slice(0, 150)}...`);

    let linkedStudents = pParsed.parent?.students || [];
    console.log(`Found linked students: ${linkedStudents.length}`);

    const parentEndpoints = [
      `/api/notifications?userId=${parentUid}&userType=parent`,
      `/api/payments?parentId=${parentUid}`
    ];
    
    for (const student of linkedStudents) {
       parentEndpoints.push(`/api/classes?studentId=${student.id}`);
       parentEndpoints.push(`/api/attendance?studentId=${student.id}`);
       parentEndpoints.push(`/api/enrollments?studentId=${student.id}`);
       parentEndpoints.push(`/api/certificates?studentId=${student.id}`);
    }

    for (const ep of parentEndpoints) {
      console.log(`\nFetching ${ep}...`);
      const res = await fetchJson(ep, token);
      console.log(`Status: ${res.status}`);
      let parsed;
      try { parsed = JSON.parse(res.body); } catch(e) {}
      console.log(`Response snippet: ${res.body.slice(0, 150)}...`);
      if (res.status !== 200) console.log(">>> FAILURE: Status != 200");
      else if (!parsed?.success) console.log(">>> FAILURE: success=false");
    }

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testFlow();
