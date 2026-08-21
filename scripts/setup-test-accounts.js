const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/`n/g, '\n').replace(/\\n/g, '\n');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

const testAccounts = [
  { email: 'admin.test@yourdomain.com', password: '098765', role: 'admin' },
  { email: 'teacher.test@yourdomain.com', password: '098765', role: 'teacher' },
  { email: 'student.test@yourdomain.com', password: '098765', role: 'student' },
  { email: 'parent.test@yourdomain.com', password: '098765', role: 'parent' }
];

async function main() {
  for (const acc of testAccounts) {
    let user;
    try {
      user = await adminAuth.getUserByEmail(acc.email);
      console.log(`Updating existing user ${acc.email}`);
      await adminAuth.updateUser(user.uid, { password: acc.password });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Creating new user ${acc.email}`);
        user = await adminAuth.createUser({
          email: acc.email,
          password: acc.password,
          emailVerified: true,
          displayName: `Test ${acc.role}`
        });
      } else {
        throw err;
      }
    }
    
    await adminAuth.setCustomUserClaims(user.uid, { role: acc.role });
    await adminDb.collection('users').doc(user.uid).set({
      email: acc.email,
      name: `Test ${acc.role}`,
      role: acc.role,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`Configured ${acc.email} as ${acc.role}`);
  }
  console.log('All test accounts configured successfully!');
  process.exit(0);
}

main().catch(console.error);
