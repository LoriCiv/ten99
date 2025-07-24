// src/app/dashboard/job-board/[id]/page.tsx
import { getJobPostingById, getPublicUserProfile } from '@/utils/firestoreService';
import { notFound } from 'next/navigation';
import JobDetailPageContent from '@/components/JobDetailPageContent';
import { Timestamp } from 'firebase/firestore';
import type { UserProfile, JobPosting } from '@/types/app-interfaces';

const TEMP_USER_ID = "dev-user-1";

// ✅ FIX: This interface needs to be correctly defined
interface PageProps {
  params: { id: string };
}

const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data as T;
};

export default async function JobDetailPage({ params }: PageProps) {
    const postId = params.id;

    const [jobPostData, currentUserProfileData] = await Promise.all([
        getJobPostingById(postId),
        getPublicUserProfile(TEMP_USER_ID)
    ]);

    if (!jobPostData) {
        notFound();
    }
    
    const jobPost = serializeData(jobPostData);
    const currentUserProfile = serializeData(currentUserProfileData);
    
    if (!jobPost) {
        notFound();
    }

    return (
        <JobDetailPageContent
            jobPost={jobPost as JobPosting}
            currentUserProfile={currentUserProfile as UserProfile | null}
            currentUserId={TEMP_USER_ID}
        />
    );
}