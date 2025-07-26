import { getJobPostingById, getPublicUserProfile, getProfileData } from '@/utils/firestoreService';
import JobBoardDetailPageContent from '@/components/JobBoardDetailPageContent';
import { auth } from "@clerk/nextjs/server";
import { notFound } from 'next/navigation';

export default async function JobBoardDetailPage({ params }: { params: { id: string } }) {
    // ✅ FIX: Added the "await" keyword here
    const { userId } = await auth(); 
    const jobPostId = params.id;

    const jobPost = await getJobPostingById(jobPostId);

    if (!jobPost) {
        notFound();
    }

    // Fetch the profile of the person who posted the job
    const posterProfile = await getPublicUserProfile(jobPost.userId);
    
    // Fetch the profile of the person VIEWING the job, if they are logged in
    const userProfile = userId ? await getProfileData(userId) : null;
    
    return (
        <JobBoardDetailPageContent
            jobPost={jobPost}
            posterProfile={posterProfile}
            userProfile={userProfile}
            currentUserId={userId}
        />
    );
}