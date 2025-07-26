import { auth } from '@clerk/nextjs/server';
import { getJobPostingById, getPublicUserProfile } from '@/utils/firestoreService';
import { notFound, redirect } from 'next/navigation';
import JobDetailPageContent from '@/components/JobDetailPageContent'; // ✅ Correct component
import { Timestamp } from 'firebase/firestore';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { Suspense } from 'react';

const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    const data: { [key: string]: any } = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data as T;
};

export default async function JobPostDetailPage({ params }: { params: { id: string }}) {
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    const postId = params.id;

    const [jobPostData, currentUserProfileData] = await Promise.all([
        getJobPostingById(postId),
        getPublicUserProfile(userId),
    ]);

    if (!jobPostData) {
        notFound();
    }

    const jobPost = serializeData(jobPostData);
    const currentUserProfile = serializeData(currentUserProfileData);

    return (
        <Suspense fallback={<div className="p-8 text-center">Loading Job Details...</div>}>
            <JobDetailPageContent // ✅ Using the correct component
                jobPost={jobPost as JobPosting}
                currentUserProfile={currentUserProfile as UserProfile | null}
                currentUserId={userId}
            />
        </Suspense>
    );
}