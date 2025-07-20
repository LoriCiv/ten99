// src/app/dashboard/job-files/[id]/page.tsx
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, Timestamp } from 'firebase/firestore';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';

const TEMP_USER_ID = "dev-user-1";

// ✅ NEW: This helper function converts Firebase Timestamps to strings
const sanitizeData = (docData: any) => {
    if (!docData) return null;
    const sanitized: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            sanitized[key] = value.toDate().toISOString();
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

async function getDocument<T>(path: string): Promise<T | null> {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = sanitizeData({ id: docSnap.id, ...docSnap.data() });
    return data as T;
}

async function getCollection<T>(path: string): Promise<T[]> {
    const collRef = collection(db, path);
    const q = query(collRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => sanitizeData({ id: doc.id, ...doc.data() }) as T);
}

export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const jobFile = await getDocument<JobFile>(`users/${TEMP_USER_ID}/jobFiles/${params.id}`);
    const clients = await getCollection<Client>(`users/${TEMP_USER_ID}/clients`);
    const contacts = await getCollection<PersonalNetworkContact>(`users/${TEMP_USER_ID}/personalNetwork`);
    const appointments = await getCollection<Appointment>(`users/${TEMP_USER_ID}/appointments`);

    if (!jobFile) {
        return <div className="p-8 text-center text-red-500">Job File not found.</div>;
    }

    return (
        <JobFileDetailPageContent
            initialJobFile={jobFile}
            initialClients={clients}
            initialContacts={contacts}
            initialAppointments={appointments}
        />
    );
}