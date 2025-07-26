import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, Timestamp } from 'firebase/firestore';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

function serializeData<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;
    const serialized: { [key: string]: any } = { ...data };
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(serialized, key) && serialized[key] instanceof Timestamp) {
            serialized[key] = serialized[key].toDate().toISOString();
        }
    }
    return serialized as T;
}

async function getCollection<T>(path: string): Promise<T[]> {
    const collRef = collection(db, path);
    const q = query(collRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as T));
}

async function getDocument<T>(path: string): Promise<T | null> {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return serializeData({ id: docSnap.id, ...docSnap.data() } as T);
    }
    return null;
}

export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const jobFileId = params.id;

    const [jobFile, clients, contacts, appointments] = await Promise.all([
        getDocument<JobFile>(`users/${userId}/jobFiles/${jobFileId}`),
        getCollection<Client>(`users/${userId}/clients`),
        getCollection<PersonalNetworkContact>(`users/${userId}/personalNetwork`),
        getCollection<Appointment>(`users/${userId}/appointments`)
    ]);

    if (!jobFile) {
        notFound();
    }

    return (
        <JobFileDetailPageContent
            initialJobFile={jobFile}
            initialClients={clients}
            initialContacts={contacts}
            initialAppointments={appointments}
            userId={userId}
        />
    );
}