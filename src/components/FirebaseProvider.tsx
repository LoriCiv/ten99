// src/components/FirebaseProvider.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { auth as firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';

interface FirebaseContextType {
    user: User | null;
    isFirebaseAuthenticated: boolean;
    isLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const { getToken, isSignedIn } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isSignedIn && !isFirebaseAuthenticated) {
            const signInToFirebase = async () => {
                try {
                    const clerkToken = await getToken({ template: 'integration_firebase' });
                    if (!clerkToken) throw new Error("Clerk token not available.");

                    const res = await fetch('/api/firebase/custom-token');
                    if (!res.ok) throw new Error("Failed to fetch Firebase custom token.");

                    const data = await res.json();
                    const { firebaseToken } = data;
                    
                    await signInWithCustomToken(firebaseAuth, firebaseToken);
                } catch (error) {
                    console.error("Firebase custom sign-in failed:", error);
                }
            };
            signInToFirebase();
        }
    }, [isSignedIn, getToken, isFirebaseAuthenticated]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
            setUser(currentUser);
            setIsFirebaseAuthenticated(!!currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ user, isFirebaseAuthenticated, isLoading }}>
            {children}
        </FirebaseContext.Provider>
    );
}

export function useFirebase() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}