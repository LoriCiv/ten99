// src/app/dashboard/job-files/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getJobFiles, getClients } from '@/utils/firestoreService';
import type { JobFile, Client } from '@/types/app-interfaces';
import JobFilesPageContent from '@/components/JobFilesPageContent';

const TEMP_USER_ID = "dev-user-1";

function JobFilesPageInternal() {
    const searchParams = useSearchParams();
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const initialClientFilter = searchParams.get('clientId');

    const fetchData = useCallback(() => {
        const userId = TEMP_USER_ID;

        const unsubJobFiles = getJobFiles(userId, (data) => {
            setJobFiles(data);
            setIsLoading(false); // Set loading to false after data is fetched
        });
        const unsubClients = getClients(userId, setClients);

        return () => {
            unsubJobFiles();
            unsubClients();
        };
    }, []);

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [fetchData]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Job Files...</div>;
    }

    return (
        <JobFilesPageContent
            jobFiles={jobFiles}
            clients={clients}
            userId={TEMP_USER_ID}
            initialClientFilter={initialClientFilter || ''}
        />
    );
}

export default function JobFilesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <JobFilesPageInternal />
        </Suspense>
    );
}