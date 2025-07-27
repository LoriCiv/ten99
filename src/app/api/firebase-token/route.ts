// src/app/api/firebase-token/route.ts

// 👇 Import 'NextRequest' here
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 👇 Use the 'NextRequest' type here
export async function GET(request: NextRequest) { 
  try {
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