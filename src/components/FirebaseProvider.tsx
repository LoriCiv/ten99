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
    const { isSignedIn } = useAuth(); // We don't need getToken here
    const [user, setUser] = useState<User | null>(null);
    const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isSignedIn && !isFirebaseAuthenticated) {
            const signInToFirebase = async () => {
                try {
                    const res = await fetch('/api/firebase/custom-token');
                    if (!res.ok) {
                        throw new Error(`Failed to fetch custom token: ${res.statusText}`);
                    }

                    const data = await res.json();
                    
                    // ✅ THE FIX: Use "token", which is what our API sends.
                    const { token } = data; 
                    if (!token) {
                        throw new Error("Token not found in API response.");
                    }
                    
                    // ✅ THE FIX: Pass the correct variable to the sign-in function.
                    await signInWithCustomToken(firebaseAuth, token);

                } catch (error) {
                    console.error("Firebase custom sign-in failed:", error);
                    // If sign-in fails, we must stop the loading state
                    // to prevent getting stuck on a blank screen.
                    setIsLoading(false); 
                }
            };
            signInToFirebase();
        } else if (!isSignedIn) {
            // If the user is not signed in, we're not loading anymore.
            setIsLoading(false);
        }
    }, [isSignedIn, isFirebaseAuthenticated]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
            setUser(currentUser);
            setIsFirebaseAuthenticated(!!currentUser);
            setIsLoading(false); // This will now run correctly after sign-in
        });
        return () => unsubscribe();
    }, []);

    // This is a temporary check. If the page is blank after this fix,
    // it means another component is using "isLoading" to hide the app.
    if (isLoading) {
       return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Loading...</p>
         </div>
       );
    }

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
