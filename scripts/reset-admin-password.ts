import { config } from 'dotenv';
config();

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

const app = getApps().length === 0
  ? initializeApp({ credential: cert({ privateKey, clientEmail, projectId }) })
  : getApps()[0];

const adminAuth = getAuth(app);

async function resetPassword() {
  const email = 'admin@srivallischool.com';
  const newPassword = 'Admin@123';

  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { password: newPassword });
    await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log('✅ Password reset successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

resetPassword();
