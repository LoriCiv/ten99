// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, getApp } from 'firebase-admin/app';

// This version reads from environment variables, NOT the JSON file.
// It is safe for both local development and Vercel deployment.
if (!getApps().length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

// Export the initialized services
const app = getApp();
const db = admin.firestore(app);
const auth = admin.auth(app);
const storage = admin.storage(app);

export { db, auth, storage };