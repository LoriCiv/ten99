// src/app/api/firebase-token/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import admin from 'firebase-admin';

// This is the final, correct initialization logic
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // It will now read the plain JSON key we uploaded via the CLI
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const firebaseToken = await admin.auth().createCustomToken(userId);
    return NextResponse.json({ firebaseToken });

  } catch (error: any) {
    console.error('Error in /api/firebase-token:', error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}