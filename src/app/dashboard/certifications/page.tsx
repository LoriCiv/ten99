// src/app/dashboard/certifications/page.tsx
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import type { Certification, CEU } from '@/types/app-interfaces';
import CertificationsPageContent from '@/components/CertificationsPageContent';

const TEMP_USER_ID = "dev-user-1";

// Helper to serialize Firestore Timestamps
const serializeData = (doc: any) => {
    const data = doc.data();
    for (const key in data) {
        if (data[key] instanceof Date || (data[key] && typeof data[key].toDate === 'function')) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data };
};


async function getCertificationsAndCEUs(userId: string) {
    const certsRef = collection(db, `users/${userId}/certifications`);
    const certsQuery = query(certsRef, orderBy('createdAt', 'desc'));
    const certsSnapshot = await getDocs(certsQuery);
    const certifications = certsSnapshot.docs.map(serializeData);

    const allCeus: CEU[] = [];
    for (const cert of certifications) {
        const ceusRef = collection(db, `users/${userId}/certifications/${cert.id}/ceus`);
        const ceusQuery = query(ceusRef, orderBy('createdAt', 'desc'));
        const ceusSnapshot = await getDocs(ceusQuery);
        const ceus = ceusSnapshot.docs.map(doc => serializeData(doc) as CEU);
        allCeus.push(...ceus);
    }
    return { certifications: certifications as Certification[], allCeus };
}


export default async function CertificationsPage() {
    const { certifications, allCeus } = await getCertificationsAndCEUs(TEMP_USER_ID);

    if (!certifications) {
        return <div className="p-8 text-center text-red-500">Could not load certifications.</div>;
    }

    return (
        <CertificationsPageContent
            initialCertifications={certifications}
            initialCeus={allCeus}
            userId={TEMP_USER_ID}
        />
    );
}