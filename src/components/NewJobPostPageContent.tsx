// src/components/NewJobPostPageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { addJobPosting, getUserProfile, updateUserProfile } from '@/utils/firestoreService';
import JobPostForm from '@/components/JobPostForm';
import Link from 'next/link';
import { ArrowLeft, Loader2, ThumbsUp, Info, X } from 'lucide-react';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook

const POST_LIMIT = 2; 

interface NewJobPostPageContentProps {
    userId: string;
}

export default function NewJobPostPageContent({ userId }: NewJobPostPageContentProps) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ New Job Post form is authenticated, fetching user profile...");
            const unsub = getUserProfile(userId, (profile) => {
                setUserProfile(profile);
                setIsLoading(false);
            });
            return () => unsub();
        }
    }, [isFirebaseAuthenticated, userId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const handleSave = async (data: Partial<JobPosting>) => {
        if (!isFirebaseAuthenticated || !userProfile) {
            showStatusMessage("error", "Could not verify user profile. Please try again.");
            return;
        }

        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${now.getMonth()}`;
        
        let currentPostCount = userProfile.monthlyPostCount || 0;
        
        if (userProfile.postCountResetDate !== currentMonthYear) {
            currentPostCount = 0;
        }

        if (currentPostCount >= POST_LIMIT) {
            showStatusMessage("error", `You have reached your monthly limit of ${POST_LIMIT} job posts.`);
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

            // We don't need a success message here as we're navigating away
            router.push('/dashboard/job-board');
        } catch (error) {
            console.error("Error posting job:", error);
            showStatusMessage('error', 'Failed to post job.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // ✅ 4. Show a loading indicator until Firebase is ready AND the profile is loaded
    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Form...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching your profile...</p>
               </div>
           </div>
        );
    }

    const postsRemaining = POST_LIMIT - (userProfile?.monthlyPostCount || 0);

    return (
        <>
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="p-1 rounded-full hover:bg-black/10"><X size={16}/></button>
                </div>
            )}
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
        </>
    );
}