import { config } from 'dotenv';
config();

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error('Missing env vars. Check .env file.');
  process.exit(1);
}

let app: App;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({ privateKey, clientEmail, projectId }),
    storageBucket: `${projectId}.firebasestorage.app`,
  });
} else {
  app = getApps()[0];
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

async function createAdmin() {
  const email = 'admin@srivallischool.com';
  const password = 'Admin@123';
  const name = 'Admin';

  try {
    console.log('Creating admin user...');
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    await adminDb.collection('admins').doc(userRecord.uid).set({
      name, email, uid: userRecord.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      name, email, role: 'admin', uid: userRecord.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID:      ${userRecord.uid}`);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-exists') {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(user.uid, { password });
      await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });
      console.log('\n✅ Admin user already exists. Password reset + Claims updated!');
      console.log(`   Email:    ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   UID:      ${user.uid}`);
    } else {
      console.error('\n❌ Error:', err.message || error);
      if (err.code === 'auth/configuration-not-found') {
        console.error('\n⚠️  Firebase Authentication is not enabled!');
        console.error('   Go to: https://console.firebase.google.com/project/srivalli-school/authentication');
        console.error('   Click "Get Started" → Enable "Email/Password" → Save');
      }
    }
  }
}

createAdmin();