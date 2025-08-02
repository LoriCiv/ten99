// src/app/dashboard/layout.tsx

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { SignedIn } from "@clerk/nextjs";
import DashboardUI from "@/components/DashboardUI";

export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // --- NEW "GET OR CREATE" BOUNCER LOGIC ---
    const userProfileRef = adminDb.doc(`users/${userId}`);
    const userProfileSnap = await userProfileRef.get();

    if (!userProfileSnap.exists) {
        // The profile doesn't exist, so we create it here on the fly.
        console.log(`User profile not found for ${userId}, creating one...`);
        const user = await currentUser(); // Get the full user object from Clerk
        const email = user?.emailAddresses[0]?.emailAddress || ''; // Get the primary email

        await userProfileRef.set({
            userId: userId,
            email: email,
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
            createdAt: new Date(),
            isProfileComplete: false,
        });
        
        // Now that we've created the basic profile, send them to onboarding.
        redirect('/onboarding');
    }

    // If the profile exists, but is not complete, send them to onboarding.
    // We add a check for data() to be safe.
    if (userProfileSnap.data() && !userProfileSnap.data()?.isProfileComplete) {
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