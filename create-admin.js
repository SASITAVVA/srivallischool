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

async function createOrUpdateAdmin() {
  const email = 'vijayalakshmi@gmail.com';
  const password = '123456';
  const name = 'D. Vijaya Lakshmi';
  const role = 'admin';

  let userRecord;
  try {
    // Check if user already exists
    userRecord = await admin.auth().getUserByEmail(email);
    console.log(`User ${email} already exists. Updating password...`);
    // Update password
    await admin.auth().updateUser(userRecord.uid, { password: password });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} not found. Creating new user...`);
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
      });
    } else {
      throw error;
    }
  }

  // Set custom claims for role
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });
  console.log(`Custom claims set to role: ${role}`);

  // Create or update Firestore document
  await db.collection('users').doc(userRecord.uid).set({
    name: name,
    email: email,
    role: role,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`Admin account ${email} configured successfully.`);
  process.exit(0);
}

createOrUpdateAdmin().catch(error => {
  console.error("Error configuring admin:", error);
  process.exit(1);
});
