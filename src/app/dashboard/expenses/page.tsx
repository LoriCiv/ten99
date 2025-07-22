// src/app/dashboard/expenses/page.tsx
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, Timestamp } from 'firebase/firestore';
import type { Expense, Client, Certification, CEU, UserProfile } from '@/types/app-interfaces';
import ExpensesPageContent from '@/components/ExpensesPageContent';

const TEMP_USER_ID = "dev-user-1";

function serializeData<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;
    const serialized = { ...data } as any;
    for (const key in serialized) {
        if (serialized[key] instanceof Timestamp) {
            serialized[key] = serialized[key].toDate().toISOString();
        }
    }
    return serialized;
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

export default async function ExpensesPage() {
    const manualExpenses = await getCollection<Expense>(`users/${TEMP_USER_ID}/expenses`);
    const clients = await getCollection<Client>(`users/${TEMP_USER_ID}/clients`);
    const certifications = await getCollection<Certification>(`users/${TEMP_USER_ID}/certifications`);
    const allCeus = await getCollection<CEU>(`users/${TEMP_USER_ID}/ceus`);
    const userProfile = await getDocument<UserProfile>(`users/${TEMP_USER_ID}/profile/main`);

    return (
        <ExpensesPageContent
            initialExpenses={manualExpenses}
            initialClients={clients}
            initialProfile={userProfile}
            initialCerts={certifications}
            initialCeus={allCeus}
            userId={TEMP_USER_ID}
        />
    );
}