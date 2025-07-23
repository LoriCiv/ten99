import admin from 'firebase-admin';

// Log the start of the initialization process
console.log("Attempting to initialize Firebase Admin SDK...");

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // Check if the service account environment variable exists
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add your storage bucket URL here
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
    });

    console.log("Firebase Admin SDK initialized SUCCESSFULLY.");
  } catch (error) {
    // Log any errors during initialization
    console.error("Firebase Admin SDK initialization FAILED:", error);
  }
} else {
  console.log("Firebase Admin SDK was already initialized.");
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { db, auth, storage };