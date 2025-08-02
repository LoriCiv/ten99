// src/utils/userProfileService.ts

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types/app-interfaces';

export const getAuthenticatedUser = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    try {
        // This path matches your original code's database structure
        const userDocRef = doc(db, `users/${userId}/profile`, 'mainProfile');
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};