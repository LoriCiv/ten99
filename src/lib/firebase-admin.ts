// src/lib/firebase-admin.ts

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors in the Next.js
// development environment (which can cause the file to be re-run).
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env.local file.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK. Please ensure the service account key in your .env.local file is a valid, non-empty JSON string.");
  }
}

// Export the initialized admin services for use in your server-side code
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();