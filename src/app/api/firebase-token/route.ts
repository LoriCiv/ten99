// src/app/api/firebase-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuth as getClerkAuth } from '@clerk/nextjs/server';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize the Firebase Admin SDK using our helper.
    //    This is safe to call on every request.
    initializeFirebaseAdmin();

    // 2. Get the Clerk user from the incoming request.
    const { userId } = getClerkAuth(request);
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized: No user ID found in Clerk session" }), { status: 401 });
    }

    // 3. Create a custom Firebase token for the authenticated user.
    const firebaseToken = await getFirebaseAuth().createCustomToken(userId);

    // 4. Send the token back to the client.
    return NextResponse.json({ firebaseToken });

  } catch (error) {
    console.error('Error in /api/firebase-token:', error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}