import { auth } from '@clerk/nextjs/server';
import { getCertificationsData, getAllCEUsData } from '@/utils/firestoreService';
import CertificationsPageContent from '@/components/CertificationsPageContent';
import type { Certification, CEU } from '@/types/app-interfaces';
import { Timestamp } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    const data: { [key: string]: any } = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data as T;
};

export default async function CertificationsPage() {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    const [certsData, ceusData] = await Promise.all([
        getCertificationsData(userId),
        getAllCEUsData(userId)
    ]);

    const initialCertifications = certsData.map(c => serializeData(c));
    const initialCeus = ceusData.map(c => serializeData(c));

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Credentials...</div>}>
            <CertificationsPageContent
                initialCertifications={initialCertifications as Certification[]}
                initialCeus={initialCeus as CEU[]}
                userId={userId}
            />
        </Suspense>
    );
}