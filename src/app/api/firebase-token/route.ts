// src/app/api/firebase-token/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import admin from 'firebase-admin';

// This function will initialize the Firebase Admin SDK only when needed.
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin right before we use it.
    initializeFirebaseAdmin();

    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const firebaseToken = await admin.auth().createCustomToken(userId);
    return NextResponse.json({ firebaseToken });

  } catch (error) {
    console.error('Error creating Firebase token:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}