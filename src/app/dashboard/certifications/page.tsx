// src/app/dashboard/certifications/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Certification, CEU } from '@/types/app-interfaces';
import { getCertifications, getCEUsForCertification } from '@/utils/firestoreService';
import CertificationsPageContent from '@/components/CertificationsPageContent';

const TEMP_USER_ID = "dev-user-1";

// ✅ THE FIX: Added specific types for the page props
export default function CertificationsPage({ params }: { params: { userId: string } }) {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [allCeus, setAllCeus] = useState<CEU[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubCertifications = getCertifications(TEMP_USER_ID, (certs) => {
            setCertifications(certs);
            
            // Fetch CEUs for all certifications
            const ceuPromises = certs.map(cert => 
                new Promise<CEU[]>((resolve) => {
                    getCEUsForCertification(TEMP_USER_ID, cert.id!, resolve);
                })
            );

            Promise.all(ceuPromises).then(results => {
                const flattenedCeus = results.flat();
                setAllCeus(flattenedCeus);
                setIsLoading(false);
            });
        });

        return () => {
            unsubCertifications();
        };
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Credentials...</div>;
    }

    return (
        <CertificationsPageContent 
            initialCertifications={certifications}
            initialCeus={allCeus}
            userId={TEMP_USER_ID}
        />
    );
}