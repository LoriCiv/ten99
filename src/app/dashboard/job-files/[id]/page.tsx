// src/app/dashboard/job-files/[id]/page.tsx
"use client"; // This needs to be a client component to use hooks

import { useState, useEffect } from 'react';
import { getJobFile, getClients, getPersonalNetwork, getAppointments } from '@/utils/firestoreService';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';
import { notFound } from 'next/navigation';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';

const TEMP_USER_ID = "dev-user-1";

// ✅ FIX: Added a specific type for the page's props
interface PageProps {
    params: { id: string };
}

export default function JobFileDetailPage({ params }: PageProps) {
    const [jobFile, setJobFile] = useState<JobFile | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const jobFileId = params.id;
        const unsubJobFile = getJobFile(TEMP_USER_ID, jobFileId, setJobFile);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubContacts = getPersonalNetwork(TEMP_USER_ID, setContacts);
        const unsubAppointments = getAppointments(TEMP_USER_ID, (data) => {
            setAppointments(data);
            setIsLoading(false); // Stop loading after the last fetch
        });

        return () => {
            unsubJobFile();
            unsubClients();
            unsubContacts();
            unsubAppointments();
        };
    }, [params.id]);

    if (isLoading) {
        return <div className="p-8 text-center">Loading Job File...</div>;
    }

    if (!jobFile) {
        notFound();
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