import { auth } from '@clerk/nextjs/server';
import { getJobFile, getClientForJobFile } from '@/utils/firestoreService';
// ✅ FIX: Corrected the import to match your filename
import JobFileDetailContent from '@/components/JobFileDetailPageContent'; 
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function JobFileDetailPage({ params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const jobFile = await getJobFile(userId, params.id);
    
    if (!jobFile) {
        notFound();
    }

    const client = jobFile.clientId ? await getClientForJobFile(userId, jobFile.clientId) : null;
    
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job File...</div>}>
            <JobFileDetailContent
                initialJobFile={jobFile}
                initialClient={client}
                userId={userId}
            />
        </Suspense>
    );
}