import JobBoardPageContent from '@/components/JobBoardPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function JobBoardPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job Board...</div>}>
            <JobBoardPageContent userId={userId} />
        </Suspense>
    );
}