import { auth } from '@clerk/nextjs/server';
import AppointmentsPageContent from '@/components/AppointmentsPageContent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// ✅ Add "async" to the function signature
export default async function AppointmentsPage() { 
    // ✅ Add "await" before the auth() call
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