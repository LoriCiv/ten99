// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import serviceAccount from './serviceAccountKey.json';

if (!getApps().length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { db, auth, storage };