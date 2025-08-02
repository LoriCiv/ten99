import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getJobFile, getClients, getPersonalNetwork, getAppointments } from '@/utils/firestoreService';
import { getAuthenticatedUser } from '@/utils/userProfileService';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';
import { Suspense } from 'react';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';

export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const { userId } = await auth(); // ✅ FIX: Added await
    if (!userId) {
        redirect('/sign-in');
    }

    const jobFileId = params.id;

    const [userProfile, jobFile, clients, contacts, appointments] = await Promise.all([
        getAuthenticatedUser(userId),
        getJobFile(userId, jobFileId),
        new Promise<Client[]>((resolve) => getClients(userId, resolve)),
        new Promise<PersonalNetworkContact[]>((resolve) => getPersonalNetwork(userId, resolve)),
        new Promise<Appointment[]>((resolve) => getAppointments(userId, resolve)),
    ]);

    if (!jobFile) {
        return <div className="p-8 text-center text-red-500">Job File not found.</div>;
    }

    const currentUserName = userProfile?.name || "Your Name";

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <JobFileDetailPageContent
                initialJobFile={jobFile}
                initialClients={clients}
                initialContacts={contacts}
                initialAppointments={appointments}
                userId={userId}
                currentUserName={currentUserName}
            />
        </Suspense>
    );
}