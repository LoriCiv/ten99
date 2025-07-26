"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { addJobPosting, getUserProfile, updateUserProfile } from '@/utils/firestoreService';
import JobPostForm from '@/components/JobPostForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/nextjs'; // Use client-side hook here

const POST_LIMIT = 2; 

export default function NewJobPostPage() {
    const router = useRouter();
    const { userId } = useAuth(); // Get userId on the client
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const unsub = getUserProfile(userId, (profile) => {
            setUserProfile(profile);
            setIsLoading(false);
        });
        return () => unsub();
    }, [userId]);

    const handleSave = async (data: Partial<JobPosting>) => {
        if (!userId || !userProfile) {
            alert("Could not verify user profile. Please try again.");
            return;
        }

        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${now.getMonth()}`;
        
        let currentPostCount = userProfile.monthlyPostCount || 0;
        
        if (userProfile.postCountResetDate !== currentMonthYear) {
            currentPostCount = 0;
        }

        if (currentPostCount >= POST_LIMIT) {
            alert(`You have reached your monthly limit of ${POST_LIMIT} job posts.`);
            return;
        }

        setIsSubmitting(true);
        try {
            await addJobPosting(userId, data);
            
            const newCount = currentPostCount + 1;
            await updateUserProfile(userId, {
                monthlyPostCount: newCount,
                postCountResetDate: currentMonthYear
            });

            alert('Job posted successfully!');
            router.push('/dashboard/job-board');
        } catch (error) {
            console.error("Error posting job:", error);
            alert('Failed to post job.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const postsRemaining = POST_LIMIT - (userProfile?.monthlyPostCount || 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/job-board" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Board
            </Link>
            <JobPostForm
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/job-board')}
                isSubmitting={isSubmitting}
                userProfile={userProfile}
                postsRemaining={postsRemaining > 0 ? postsRemaining : 0}
                postLimit={POST_LIMIT}
            />
        </div>
    );
}