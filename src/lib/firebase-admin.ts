import admin from 'firebase-admin';

// This is the configuration for your server-side connection to Firebase.

// Check if the app is already initialized to prevent re-initializing on every server request.
if (!admin.apps.length) {
  try {
    // This safely reads the entire JSON key you pasted into your Vercel environment variables.
    const serviceAccountJson = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string
    );

    // Initialize the Firebase Admin app with your credentials.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
    });

    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Export the initialized Firestore database instance for use in your server-side functions.
export const adminDb = admin.firestore();