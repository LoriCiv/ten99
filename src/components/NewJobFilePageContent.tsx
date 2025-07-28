// src/components/NewJobFilePageContent.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { JobFile, Client, Appointment } from '@/types/app-interfaces';
import { getClients, getAppointments, addJobFile } from '@/utils/firestoreService';
import JobFileForm from '@/components/JobFileForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook

interface NewJobFilePageContentProps {
    userId: string;
}

// The main component logic
function NewJobFilePageContentInternal({ userId }: NewJobFilePageContentProps) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const initialClientId = searchParams.get('clientId') || '';
    const initialAppointmentId = searchParams.get('appointmentId') || '';
    const initialSubject = searchParams.get('subject') || '';

    const prefilledData: Partial<JobFile> = {
        clientId: initialClientId,
        appointmentId: initialAppointmentId,
        jobTitle: initialSubject,
    };

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ New Job File form is authenticated, fetching data...");
            const unsubClients = getClients(userId, setClients);
            const unsubAppointments = getAppointments(userId, (data) => {
                setAppointments(data);
                setIsLoading(false); // Stop loading once all data is here
            });
            return () => { unsubClients(); unsubAppointments(); };
        }
    }, [isFirebaseAuthenticated, userId]);

    const handleSaveJobFile = async (jobFileData: Partial<JobFile>) => {
        if (!isFirebaseAuthenticated) {
            setStatusMessage("Authentication error. Please wait and try again.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage(null);
        
        const finalJobData = { ...jobFileData };
        const linkedAppointment = appointments.find(a => a.id === jobFileData.appointmentId);

        if (linkedAppointment) {
            const appointmentSeries = linkedAppointment.seriesId
                ? appointments.filter(a => a.seriesId === linkedAppointment.seriesId)
                : [linkedAppointment];

            if (appointmentSeries.length > 0) {
                appointmentSeries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                finalJobData.startDate = appointmentSeries[0].date;
                finalJobData.endDate = appointmentSeries[appointmentSeries.length - 1].date;
            }
        }

        try {
            await addJobFile(userId, finalJobData);
            router.push('/dashboard/job-files');
        } catch (error) {
            console.error("Error saving job file:", error);
            setStatusMessage("Failed to save job file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ 4. Show a loading indicator until Firebase is ready AND data is loaded
    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Form...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching initial data...</p>
               </div>
           </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/job-files" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Files
            </Link>
            <JobFileForm
                onSave={handleSaveJobFile}
                onCancel={() => router.push('/dashboard/job-files')}
                clients={clients}
                appointments={appointments}
                initialData={prefilledData}
                isSubmitting={isSubmitting}
                userId={userId}
                statusMessage={statusMessage}
            />
        </div>
    );
}

// We keep the wrapper to handle Suspense for reading search parameters
export default function NewJobFilePageContent({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <NewJobFilePageContentInternal userId={userId} />
        </Suspense>
    );
}