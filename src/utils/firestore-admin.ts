// src/utils/firestore-admin.ts

import { adminDb } from '@/lib/firebase-admin';
import type { Client, PersonalNetworkContact, JobFile, Appointment, UserProfile } from '@/types/app-interfaces';
import admin from 'firebase-admin';

// Helper function to serialize data from the Admin SDK
const serializeAdminData = <T extends object>(doc: FirebaseFirestore.DocumentSnapshot): T | null => {
    if (!doc.exists) return null;
    const data = doc.data() as { [key: string]: any };
    for (const key in data) {
        if (data[key] instanceof admin.firestore.Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data } as T;
};

// Admin SDK version of getAuthenticatedUser
export const getAuthenticatedUserAdmin = async (userId: string): Promise<UserProfile | null> => {
    const docRef = adminDb.doc(`users/${userId}/profile/mainProfile`);
    const docSnap = await docRef.get();
    return serializeAdminData<UserProfile>(docSnap);
};

// Admin SDK version of getJobFile
export const getJobFileAdmin = async (userId: string, jobFileId: string): Promise<JobFile | null> => {
    const docRef = adminDb.doc(`users/${userId}/jobFiles/${jobFileId}`);
    const docSnap = await docRef.get();
    return serializeAdminData<JobFile>(docSnap);
};

// Admin SDK version of getClientsData
export const getClientsDataAdmin = async (userId: string): Promise<Client[]> => {
    const snapshot = await adminDb.collection(`users/${userId}/clients`).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => serializeAdminData<Client>(doc)!).filter(Boolean);
};

// Admin SDK version of getPersonalNetworkData
export const getPersonalNetworkDataAdmin = async (userId: string): Promise<PersonalNetworkContact[]> => {
    const snapshot = await adminDb.collection(`users/${userId}/personalNetwork`).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => serializeAdminData<PersonalNetworkContact>(doc)!).filter(Boolean);
};

// Admin SDK version of getAppointmentsData
export const getAppointmentsDataAdmin = async (userId: string): Promise<Appointment[]> => {
    const snapshot = await adminDb.collection(`users/${userId}/appointments`).orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => serializeAdminData<Appointment>(doc)!).filter(Boolean);
};