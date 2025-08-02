// src/app/onboarding/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache"; // 👈 1. ADD THIS IMPORT

// This is a Server Action. It's a secure function that runs only on the server.
async function updateUserProfile(formData: FormData) {
    "use server";
    
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
        return;
    }

    const name = formData.get("name") as string;
    
    if (!name || name.trim().length < 2) {
        return;
    }

    try {
        await adminDb.doc(`users/${userId}`).update({
            name: name,
            isProfileComplete: true, // Mark the profile as complete!
        });
    } catch (error) {
        console.error("Error updating profile in onboarding:", error);
        return;
    }

    // ✅ 2. THIS IS THE FIX: Manually clear the cache for the dashboard path.
    revalidatePath('/dashboard');

    // Now, redirect.
    redirect("/dashboard"); 
}

export default async function OnboardingPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }
    
    const userProfileSnap = await adminDb.doc(`users/${userId}`).get();
    if (userProfileSnap.exists && userProfileSnap.data()?.isProfileComplete) {
      redirect("/dashboard");
    }

    const user = await currentUser();
    
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Welcome to Ten99!</h1>
                    <p className="text-muted-foreground">Let's set up your profile to get started.</p>
                </div>
                <form action={updateUserProfile} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name"
                            defaultValue={user?.firstName ? `${user.firstName} ${user.lastName}`.trim() : ""}
                            placeholder="John Doe"
                            required
                            className="w-full mt-1 p-2 bg-background border rounded-md" 
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    );
}