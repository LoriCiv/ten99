// src/app/dashboard/job-files/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';
import { getJobFile, getClients, getPersonalNetwork, getAppointments } from '@/utils/firestoreService';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';

const TEMP_USER_ID = "dev-user-1";

export default function JobFileDetailPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [jobFile, setJobFile] = useState<JobFile | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = () => {
            const unsubJobFile = getJobFile(TEMP_USER_ID, id, (data) => {
                if (data) {
                    setJobFile(data);
                } else {
                    setError("Job File not found.");
                }
                setIsLoading(false);
            });

            const unsubClients = getClients(TEMP_USER_ID, setClients);
            const unsubContacts = getPersonalNetwork(TEMP_USER_ID, setContacts);
            const unsubAppointments = getAppointments(TEMP_USER_ID, setAppointments);

            return () => {
                unsubJobFile();
                unsubClients();
                unsubContacts();
                unsubAppointments();
            };
        };

        const cleanup = fetchData();
        return cleanup;
    }, [id]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Job File...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

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