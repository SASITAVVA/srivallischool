const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Use the service account from the env var FIREBASE_SERVICE_ACCOUNT
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

const users = [
  { email: 'admin@srivalli.com', password: 'password123', name: 'Admin User', role: 'admin' },
  { email: 'teacher@srivalli.com', password: 'password123', name: 'Teacher User', role: 'teacher' },
  { email: 'student@srivalli.com', password: 'password123', name: 'Student User', role: 'student' },
  { email: 'parent@srivalli.com', password: 'password123', name: 'Parent User', role: 'parent' }
];

async function seed() {
  for (const u of users) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`User ${u.email} already exists.`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: u.name,
          });
          console.log(`Created user ${u.email}`);
        } else {
          throw e;
        }
      }

      await auth.setCustomUserClaims(userRecord.uid, { role: u.role });
      
      const coll = u.role === 'admin' ? 'admins' : u.role === 'teacher' ? 'teachers' : u.role === 'student' ? 'students' : 'parents';
      
      await db.collection(coll).doc(userRecord.uid).set({
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`Set custom claims and DB record for ${u.email}`);
    } catch (err) {
      console.error(`Error with ${u.email}:`, err);
    }
  }
}

seed().then(() => process.exit(0));
