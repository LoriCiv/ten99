// src/app/api/firebase-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuth as getClerkAuth } from '@clerk/nextjs/server';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize the Firebase Admin SDK.
    // This now has better internal error handling.
    console.log("API Route: Attempting to initialize Firebase Admin...");
    initializeFirebaseAdmin();
    console.log("API Route: Firebase Admin initialized.");

    // 2. Get the Clerk user.
    const { userId } = getClerkAuth(request);
    if (!userId) {
      console.error("API Route Error: Unauthorized - No user ID in Clerk session.");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    console.log(`API Route: Found user ID: ${userId}`);

    // 3. Create a custom Firebase token.
    console.log("API Route: Attempting to create custom token...");
    const firebaseToken = await getFirebaseAuth().createCustomToken(userId);
    console.log("API Route: Successfully created custom token.");

    // 4. Send the token back to the client.
    return NextResponse.json({ firebaseToken });

  } catch (error) {
    // This is our new, detailed error logging.
    console.error('🔥 FATAL ERROR in /api/firebase-token route:');
    if (error instanceof Error) {
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
    } else {
        console.error('An unexpected error object was thrown:', error);
    }
    
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}