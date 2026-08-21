require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Decode the B64 key safely
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
if (!b64Key) {
  console.error("Error: FIREBASE_PRIVATE_KEY_B64 is missing from .env.local!");
  process.exit(1);
}
const privateKey = Buffer.from(b64Key, 'base64').toString('utf-8');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const auth = getAuth(app);
const db = getFirestore(app);

const testUsers = [
  { email: 'admin@example.com', password: 'Password123!', name: 'Test Admin', role: 'admin', collection: 'admins' },
  { email: 'teacher@example.com', password: 'Password123!', name: 'Test Teacher', role: 'teacher', collection: 'teachers' },
  { email: 'parent@example.com', password: 'Password123!', name: 'Test Parent', role: 'parent', collection: 'parents' },
  { email: 'student@example.com', password: 'Password123!', name: 'Test Student', role: 'student', collection: 'students' }
];

async function seed() {
  console.log("Seeding test users securely...");
  for (const user of testUsers) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`User ${user.email} exists, updating...`);
        await auth.updateUser(userRecord.uid, { password: user.password });
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          console.log(`Creating user ${user.email}...`);
          userRecord = await auth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.name,
          });
        } else {
          throw e;
        }
      }

      await auth.setCustomUserClaims(userRecord.uid, { role: user.role });

      const profileData = {
        name: user.name,
        email: user.email,
        role: user.role,
        uid: userRecord.uid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await db.collection(user.collection).doc(userRecord.uid).set(profileData, { merge: true });
      console.log(`✅ Seeded ${user.role} successfully!`);
    } catch (err) {
      console.error(`❌ Failed to seed ${user.email}:`, err.message);
    }
  }
  console.log("Done!");
}

seed();
