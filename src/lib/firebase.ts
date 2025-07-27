// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Useful debug line to confirm the env is working
console.log('Storage Bucket from env:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

// Firebase config pulled from .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ✅ This is controlled via .env
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
