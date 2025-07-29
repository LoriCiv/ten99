// src/app/api/firebase/custom-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin'; // You should already have this file
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { auth as clerkAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
    try {
        const { userId } = clerkAuth();

        if (!userId) {
            return new NextResponse("User not authenticated with Clerk.", { status: 401 });
        }
        
        // Initialize Firebase Admin SDK
        initializeFirebaseAdmin();
        const adminAuth = getAdminAuth();
        
        // Create a custom Firebase token for the logged-in user
        const firebaseToken = await adminAuth.createCustomToken(userId);
        
        return NextResponse.json({ firebaseToken });

    } catch (error) {
        console.error("Error creating Firebase custom token:", error);
        return new NextResponse("Internal Server Error while creating Firebase token.", { status: 500 });
    }
}