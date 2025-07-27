// src/app/api/firebase-token/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import admin from 'firebase-admin';

// This new function has much better error logging
async function initializeFirebaseAdmin() {
  // Only initialize if it hasn't been done already
  if (admin.apps.length > 0) {
    return;
  }

  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      // This log will tell us if the variable is missing in Vercel
      console.error('Vercel Env Var Error: FIREBASE_SERVICE_ACCOUNT_BASE64 is not defined.');
      throw new Error('Firebase service account key is not available in environment.');
    }

    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    // This will log the exact reason for the failure (e.g., invalid JSON)
    console.error('CRITICAL ERROR initializing Firebase Admin SDK:', error.message);
    throw error; // Re-throw to ensure the main function fails
  }
}

export async function GET(request: NextRequest) {
  try {
    // Await the initialization and catch any errors from it
    await initializeFirebaseAdmin();

    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized: No user ID found in Clerk session", { status: 401 });
    }

    const firebaseToken = await admin.auth().createCustomToken(userId);
    return NextResponse.json({ firebaseToken });

  } catch (error: any) {
    // This is our final catch-all to see what went wrong
    console.error('Error in /api/firebase-token GET handler:', error.message);
    return new NextResponse("Internal Server Error: Could not generate Firebase token.", { status: 500 });
  }
}