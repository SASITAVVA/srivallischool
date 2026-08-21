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
        
        // Update the password to ensure it matches
        await auth.updateUser(userRecord.uid, { password: u.password });
        console.log(`Updated password for ${u.email}`);
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
      console.error(`Error with ${u.email}:`, err.message);
    }
  }
}

seed().then(() => process.exit(0)).catch(console.error);
