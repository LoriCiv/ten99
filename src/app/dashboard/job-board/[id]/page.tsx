// src/app/dashboard/job-board/[id]/page.tsx
import { getJobPostingById, getPublicUserProfile } from '@/utils/firestoreService';
import { notFound } from 'next/navigation';
import JobDetailPageContent from '@/components/JobDetailPageContent';
import { Timestamp } from 'firebase/firestore';

const TEMP_USER_ID = "dev-user-1";

// Helper function to convert Firestore Timestamps to strings
const serializeData = (doc: any) => {
    if (!doc) return null;
    const data = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data;
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const postId = params.id;

    const [jobPostData, currentUserProfileData] = await Promise.all([
        getJobPostingById(postId),
        getPublicUserProfile(TEMP_USER_ID)
    ]);

    if (!jobPostData) {
        notFound();
    }

    // ✅ FIX: Serialize the data before passing it to the client component
    const jobPost = serializeData(jobPostData);
    const currentUserProfile = serializeData(currentUserProfileData);

    return (
        <JobDetailPageContent 
            jobPost={jobPost} 
            currentUserProfile={currentUserProfile}
            currentUserId={TEMP_USER_ID}
        />
    );
}