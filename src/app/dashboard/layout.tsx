// src/app/dashboard/layout.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { SignedIn } from "@clerk/nextjs";
import DashboardUI from "@/components/DashboardUI"; // The new UI component we just made

// This is now a Server Component that can fetch data and redirect.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // ✅ CORRECTED: Added the 'await' keyword here.
    const { userId } = await auth();

    // This should be handled by your main middleware, but it's a good safeguard.
    if (!userId) {
        redirect('/sign-in');
    }

    // --- THIS IS THE "BOUNCER" LOGIC ---
    const userProfileSnap = await adminDb.doc(`users/${userId}`).get();
    
    // If the user's profile doesn't exist, OR if it's not complete, redirect to onboarding.
    if (!userProfileSnap.exists || !userProfileSnap.data()?.isProfileComplete) {
        redirect('/onboarding');
    }
    // --- END BOUNCER LOGIC ---

    return (
        <SignedIn>
            <FirebaseProvider>
                <DashboardUI>
                    {children}
                </DashboardUI>
            </FirebaseProvider>
        </SignedIn>
    );
}