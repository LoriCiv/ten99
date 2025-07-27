// src/app/dashboard/appointments/page.tsx

import { auth } from '@clerk/nextjs/server';
import AppointmentsPageContent from '@/components/AppointmentsPageContent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

export default async function AppointmentsPage() { 
    const { userId } = await auth(); 

    if (!userId) {
      redirect('/sign-in');
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Calendar...</div>}>
            <AppointmentsPageContent userId={userId} />
        </Suspense>
    ); 
}