import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let key = process.env.FIREBASE_PRIVATE_KEY || '';
console.log('Original key length:', key.length);
console.log('Original key snippet:', key.slice(0, 50));

if (process.env.FIREBASE_PRIVATE_KEY_B64) {
  console.log('B64 key exists!');
}

let decodedKey = key.replace(/\\n/g, '\n');
console.log('Decoded key length:', decodedKey.length);
console.log('Decoded key snippet:', decodedKey.slice(0, 50));

if (!decodedKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.log('WARNING: DOES NOT CONTAIN HEADER');
}
