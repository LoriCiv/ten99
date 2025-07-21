// src/app/dashboard/job-files/[id]/page.tsx
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, Timestamp } from 'firebase/firestore';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';

const TEMP_USER_ID = "dev-user-1";

// ✅ THE FINAL FIX: Using the simple function and telling the linter to ignore the 'any' type for just this block.
/* eslint-disable @typescript-eslint/no-explicit-any */
const serializeTimestamps = (data: any): any => {
    if (!data) return data;
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            data[key] = serializeTimestamps(data[key]);
        }
    }
    return data;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

async function getDocument<T>(path: string): Promise<T | null> {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    const data = { id: docSnap.id, ...docSnap.data() };
    return serializeTimestamps(data) as T;
}

async function getCollection<T>(path: string): Promise<T[]> {
    const collRef = collection(db, path);
    const q = query(collRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeTimestamps({ id: doc.id, ...doc.data() }) as T);
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