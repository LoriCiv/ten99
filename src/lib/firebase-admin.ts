// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import serviceAccount from './serviceAccountKey.json';

if (!getApps().length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as any),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

// ✅ FIX: We now export the entire admin object by default
export default admin;