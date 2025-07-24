import admin from 'firebase-admin';
import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// This function decodes the Base64 key from Vercel's environment variables
const getFirebaseCredentials = () => {
  const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encodedKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable not set.');
  }
  // Decode the Base64 string into the original JSON string
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
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.stack);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

export { db, auth, storage };