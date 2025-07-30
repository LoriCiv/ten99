// src/app/api/firebase/custom-token/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // We MUST use 'await' here because auth() is an async function.
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const firebaseToken = await adminAuth.createCustomToken(userId);

    return NextResponse.json({ token: firebaseToken });

  } catch (error) {
    console.error('🔥 FATAL ERROR in /api/firebase/custom-token route:', error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error creating Firebase token." }),
      { status: 500 }
    );
  }
}