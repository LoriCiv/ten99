// src/app/dashboard/job-board/[id]/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import JobDetailPageContent from '@/components/JobDetailPageContent';
import { Suspense } from 'react';

// This is the simple, safe server component shell
export default async function JobPostDetailPage({ params }: { params: { id: string }}) {
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    const postId = params.id;

    // We no longer fetch data here. We just pass the IDs to the client component.
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading Job Details...</div>}>
            <JobDetailPageContent 
                currentUserId={userId}
                postId={postId}
            />
        </Suspense>
    );
}