import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
// ✅ FIX: Imports the correct "one-time fetch" functions
import { 
    getJobFile, 
    getClientsData, 
    getPersonalNetworkData, 
    getAppointmentsData 
} from '@/utils/firestoreService';
import { getAuthenticatedUser } from '@/utils/userProfileService';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';
import { Suspense } from 'react';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';

export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const jobFileId = params.id;

    try {
        // ✅ FIX: This now correctly calls the async "Data" functions, which will not crash the server.
        const [userProfile, jobFile, clients, contacts, appointments] = await Promise.all([
            getAuthenticatedUser(userId),
            getJobFile(userId, jobFileId),
            getClientsData(userId),
            getPersonalNetworkData(userId),
            getAppointmentsData(userId),
        ]);

        if (!jobFile) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold">Job File Not Found</h2>
                    <p className="text-muted-foreground mt-2">This file may have been deleted.</p>
                    <Link href="/dashboard/job-files" className="mt-4 inline-block bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg">
                        Back to Job Files
                    </Link>
                </div>
            );
        }

        const currentUserName = userProfile?.name || "Your Name";

        return (
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job File...</div>}>
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
    } catch (error) {
        console.error("Error fetching job file details:", error);
        return (
             <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-destructive">Error Loading Page</h2>
                <p className="text-muted-foreground mt-2">There was a problem fetching the data for this job file.</p>
                 <Link href="/dashboard/job-files" className="mt-4 inline-block bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg">
                    Back to Job Files
                </Link>
            </div>
        )
    }
}