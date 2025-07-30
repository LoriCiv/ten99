import { auth } from '@clerk/nextjs/server';
import JobBoardPageContent from '@/components/JobBoardPageContent';
import { getJobPostingsData, getProfileData } from '@/utils/firestoreService';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';

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

export default async function JobBoardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Fetch data on the server
    const [jobPostingsData, userProfileData] = await Promise.all([
        getJobPostingsData(),
        getProfileData(userId)
    ]);

    // Serialize the data and filter out any null values
    const jobPostings = jobPostingsData.map(post => serializeData(post)).filter(Boolean) as JobPosting[];
    const userProfile = serializeData(userProfileData);

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job Board...</div>}>
            <JobBoardPageContent 
                initialJobPostings={jobPostings}
                currentUserProfile={userProfile}
                userId={userId}
            />
        </Suspense>
    );
}