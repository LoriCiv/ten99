// src/lib/firebase-admin.ts

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKeyBase64) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  try {
    // This decodes the Base64 string back into a normal JSON string.
    const decodedServiceAccountKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
    
    // This parses the decoded JSON string.
    const serviceAccount = JSON.parse(decodedServiceAccountKey);

    // Initialize the app with the credentials.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK. Check the FIREBASE_SERVICE_ACCOUNT_KEY format.");
  }
}

// Export the initialized admin services for use in your server-side code.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();