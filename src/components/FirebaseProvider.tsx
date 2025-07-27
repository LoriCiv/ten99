// src/components/FirebaseProvider.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { auth as firebaseAuth } from '@/lib/firebase'; // Make sure this path is correct
import { signInWithCustomToken } from 'firebase/auth';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  useEffect(() => {
    const signInToFirebase = async () => {
      // Use Clerk token to get a Firebase token from our API route
      const clerkToken = await getToken({ template: 'integration_firebase' });
      const res = await fetch('/api/firebase-token', {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch Firebase token");
        setIsFirebaseAuthenticated(false);
        return;
      }
      
      const { firebaseToken } = await res.json();
      
      // Use the Firebase token to sign in with the Firebase SDK
      await signInWithCustomToken(firebaseAuth, firebaseToken);
      setIsFirebaseAuthenticated(true);
    };

    if (isSignedIn && !isFirebaseAuthenticated) {
      signInToFirebase();
    }
  }, [isSignedIn, getToken, isFirebaseAuthenticated]);

  return <>{children}</>;
}