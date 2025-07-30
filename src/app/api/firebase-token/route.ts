// src/app/api/firebase-token/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // 1. Get the authenticated user from Clerk.
    // We MUST use 'await' here because auth() is an async function.
    const { userId } = await auth(); // <-- This is the fix

    if (!userId) {
      console.error("API Route Error: Unauthorized - No user ID found in Clerk session.");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Create a custom Firebase token for the user.
    const firebaseToken = await adminAuth.createCustomToken(userId);

    // 3. Send the token back to the client.
    return NextResponse.json({ token: firebaseToken });

  } catch (error) {
    console.error('🔥 FATAL ERROR in /api/firebase-token route:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error creating Firebase token." }),
      { status: 500 }
    );
  }
}