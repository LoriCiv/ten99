import admin from 'firebase-admin';
// ✅ FIX: Removed unused 'getApp' from this line
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

const getFirebaseCredentials = () => {
  const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encodedKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set.');
  }
  const jsonKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
  return JSON.parse(jsonKey);
};

if (!getApps().length) {
  try {
    initializeApp({
      credential: admin.credential.cert(getFirebaseCredentials()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) { // ✅ FIX: Changed 'error: any' to the safer default 'error'
    if (error instanceof Error) {
        console.error("Firebase Admin SDK initialization error:", error.stack);
    } else {
        console.error("Firebase Admin SDK initialization error:", error);
    }
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

export { db, auth, storage };