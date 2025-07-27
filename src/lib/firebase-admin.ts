// src/lib/firebase-admin.ts

import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is safe to call multiple times.
 */
export function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return;
  }

  // Ensure the environment variable is set
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  try {
    // Parse the JSON key from the environment variable
    const serviceAccount = JSON.parse(serviceAccountKey);

    // Initialize the app with the service account credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin:", error);
    // Re-throw the error to be caught by the calling function
    throw new Error("Failed to initialize Firebase Admin SDK.");
  }
}