// src/components/JobFilesPageInternal.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getJobFiles, getClients, getAppointments } from '@/utils/firestoreService';
import type { JobFile, Client, Appointment } from '@/types/app-interfaces';
import JobFilesPageContent from '@/components/JobFilesPageContent';

// Using our temporary ID for development
const TEMP_USER_ID = "dev-user-1";

export default function JobFilesPageInternal() {
  const searchParams = useSearchParams();
  const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialClientIdFilter = searchParams.get('clientId') || '';

  const fetchData = useCallback(() => {
    const userId = TEMP_USER_ID;
    
    const unsubJobFiles = getJobFiles(userId, setJobFiles);
    const unsubClients = getClients(userId, setClients);
    const unsubAppointments = getAppointments(userId, (data) => {
      setAppointments(data);
      setIsLoading(false);
    });

    return () => {
      unsubJobFiles();
      unsubClients();
      unsubAppointments();
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
    <div>
      {/* This is the part that fixes the error. It correctly passes all the required data. */}
      <JobFilesPageContent
        jobFiles={jobFiles}
        clients={clients}
        appointments={appointments}
        userId={TEMP_USER_ID}
        onDataAdded={fetchData}
        initialClientFilter={initialClientIdFilter}
      />
    </div>
  );
}