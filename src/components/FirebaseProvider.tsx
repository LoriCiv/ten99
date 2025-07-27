// src/components/FirebaseProvider.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';

// 1. Create a context to hold the Firebase auth state ("the green light")
const FirebaseContext = createContext<{ user: User | null; isFirebaseAuthenticated: boolean }>({
  user: null,
  isFirebaseAuthenticated: false,
});

// 2. Create a custom hook to easily check the light's status
export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  useEffect(() => {
    const signIn = async () => {
      try {
        const clerkToken = await getToken({ template: 'integration_firebase' });
        if (clerkToken) {
          const res = await fetch('/api/firebase-token', {
            headers: { Authorization: `Bearer ${clerkToken}` },
          });
          if (!res.ok) {
            console.error("Failed to fetch Firebase token from API", res.status);
            setIsFirebaseAuthenticated(false); // Keep the light red
            return;
          }
          const { firebaseToken } = await res.json();
          await signInWithCustomToken(firebaseAuth, firebaseToken);
        }
      } catch (error) {
        console.error("Error signing into Firebase:", error);
        setIsFirebaseAuthenticated(false); // Keep the light red
      }
    };

    if (isSignedIn) {
      signIn();
    }

    // This is the official listener from Firebase. It tells us the exact moment the user is logged in.
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setIsFirebaseAuthenticated(!!user); // The light turns green HERE
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [isSignedIn, getToken]);

  return (
    <FirebaseContext.Provider value={{ user: firebaseUser, isFirebaseAuthenticated }}>
      {children}
    </FirebaseContext.Provider>
  );
}