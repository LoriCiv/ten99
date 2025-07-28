// src/app/dashboard/job-files/[id]/page.tsx

import { auth } from '@clerk/nextjs/server';
import JobFileDetailContent from '@/components/JobFileDetailContent'; 
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

// This is the simple, safe server component shell
export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const jobFileId = params.id;
    
    // We no longer fetch data here. We just pass the IDs to the client component.
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job File...</div>}>
            <JobFileDetailContent
                userId={userId}
                jobFileId={jobFileId}
            />
        </Suspense>
    );
}