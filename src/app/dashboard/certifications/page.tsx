// src/app/dashboard/certifications/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Certification, CEU } from '@/types/app-interfaces';
import { getCertifications, getAllCEUs } from '@/utils/firestoreService';
import CertificationsPageContent from '@/components/CertificationsPageContent';

const TEMP_USER_ID = "dev-user-1";

export default function CertificationsPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [allCeus, setAllCeus] = useState<CEU[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubCerts = getCertifications(TEMP_USER_ID, setCertifications);
        // This now uses our new, more efficient function to get all CEUs at once
        const unsubCEUs = getAllCEUs(TEMP_USER_ID, (ceus) => {
            setAllCeus(ceus);
            setIsLoading(false); // We know all data is loaded now
        });

        return () => {
            unsubCerts();
            unsubCEUs();
        };
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading credentials...</div>;
    }

    // We pass the fully loaded data down to the component that displays it
    return (
        <CertificationsPageContent
            initialCertifications={certifications}
            initialCeus={allCeus}
            userId={TEMP_USER_ID}
        />
    );
}