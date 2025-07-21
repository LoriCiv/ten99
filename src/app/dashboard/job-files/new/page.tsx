// src/app/dashboard/job-files/new/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { JobFile, Client, Appointment } from '@/types/app-interfaces';
import { getClients, getAppointments, addJobFile } from '@/utils/firestoreService';
import JobFileForm from '@/components/JobFileForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

function NewJobFilePageInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialClientId = searchParams.get('clientId') || '';
    const initialAppointmentId = searchParams.get('appointmentId') || '';
    const initialSubject = searchParams.get('subject') || '';

    const prefilledData: Partial<JobFile> = {
        clientId: initialClientId,
        appointmentId: initialAppointmentId,
        jobTitle: initialSubject,
    };

    const fetchData = useCallback(() => {
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubAppointments = getAppointments(TEMP_USER_ID, (data) => {
            setAppointments(data);
            setIsLoading(false);
        });
        return () => { unsubClients(); unsubAppointments(); };
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveJobFile = async (jobFileData: Partial<JobFile>) => {
        setIsSubmitting(true);
        
        // ✅ THE FIX: Changed 'let' to 'const'
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
            await addJobFile(TEMP_USER_ID, finalJobData);
            alert("Job File saved successfully!");
            router.push('/dashboard/job-files');
        } catch (error) {
            console.error("Error saving job file:", error);
            alert("Failed to save job file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
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
            />
        </div>
    );
}

export default function NewJobFilePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <NewJobFilePageInternal />
        </Suspense>
    );
}