// src/app/dashboard/clients/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getClients, getPersonalNetwork, getJobFiles } from '@/utils/firestoreService';
import ClientsPageContent from '@/components/ClientsPageContent';

// Using our temporary ID for development
const TEMP_USER_ID = "dev-user-1";

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(() => {
        setIsLoading(true);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        
        // ✅ THIS IS THE FIX: We are now fetching contacts and job files
        const unsubContacts = getPersonalNetwork(TEMP_USER_ID, setContacts);
        const unsubJobFiles = getJobFiles(TEMP_USER_ID, (data) => {
            setJobFiles(data);
            setIsLoading(false); // Stop loading only after the last fetch is done
        });

        return () => {
            unsubClients();
            unsubContacts();
            unsubJobFiles();
        };
    }, []);

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [fetchData]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <ClientsPageContent
            clients={clients}
            contacts={contacts}
            jobFiles={jobFiles}
            userId={TEMP_USER_ID}
        />
    );
}