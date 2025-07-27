// src/components/FirebaseProvider.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth as firebaseClientAuth } from "@/lib/firebase"; // Your client-side firebase config
import { useUser } from "@clerk/nextjs";

// Define the shape of the context data
interface FirebaseContextType {
  isFirebaseAuthenticated: boolean;
}

// Create the context
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// The Provider component
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
  const { isSignedIn, isLoaded } = useUser(); // Clerk's hook

  useEffect(() => {
    // Only run this effect when Clerk has loaded and there's a signed-in user
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // If we're already authenticated, don't do it again
    if (isFirebaseAuthenticated) {
      return;
    }

    const signInToFirebase = async () => {
      try {
        console.log("Clerk user loaded. Attempting to fetch Firebase token...");
        // Fetch the custom token from our API route
        const response = await fetch("/api/firebase-token");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch Firebase token");
        }

        const { firebaseToken } = await response.json();
        
        // Sign in to Firebase on the client with the custom token
        await signInWithCustomToken(firebaseClientAuth, firebaseToken);
        
        console.log("✅ Firebase authentication successful!");
        // Set our "green light" to true
        setIsFirebaseAuthenticated(true);
      } catch (error) {
        console.error("🔥 Firebase sign-in error:", error);
        setIsFirebaseAuthenticated(false);
      }
    };

    signInToFirebase();

  }, [isLoaded, isSignedIn, isFirebaseAuthenticated]);

  return (
    <FirebaseContext.Provider value={{ isFirebaseAuthenticated }}>
      {children}
    </FirebaseContext.Provider>
  );
}

// The hook that pages will use to check for the "green light"
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};