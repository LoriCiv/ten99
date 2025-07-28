// src/components/JobDetailPageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { sendJobApplicationMessage, getJobPostingById, getPublicUserProfile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Send, Loader2, CheckCircle, ThumbsUp, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook

interface JobDetailPageContentProps {
    currentUserId: string;
    postId: string;
}

export default function JobDetailPageContent({ currentUserId, postId }: JobDetailPageContentProps) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const [jobPost, setJobPost] = useState<JobPosting | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isApplying, setIsApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ Job Detail page is authenticated, fetching data...");
            
            Promise.all([
                getJobPostingById(postId),
                getPublicUserProfile(currentUserId)
            ]).then(([jobData, profileData]) => {
                setJobPost(jobData);
                setCurrentUserProfile(profileData);
                setIsLoading(false);
            }).catch(error => {
                console.error("Error fetching job details:", error);
                setIsLoading(false);
            });
        }
    }, [isFirebaseAuthenticated, currentUserId, postId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleApply = async () => {
        if (!currentUserProfile || !jobPost) return;
        setIsApplying(true);
        try {
            await sendJobApplicationMessage(currentUserId, currentUserProfile, jobPost);
            setHasApplied(true);
            showStatusMessage("success", "Application sent successfully!");
        } catch (error) {
            console.error("Failed to apply:", error);
            showStatusMessage("error", `Error applying: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsApplying(false);
        }
    };
    
    // ✅ 4. Show a loading indicator until Firebase is ready AND data is loaded
    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Job Details...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching data...</p>
               </div>
           </div>
        );
    }

    if (!jobPost) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Job Not Found</h2>
                <p className="text-muted-foreground mt-2">This job posting may have been removed or the link is incorrect.</p>
                <Link href="/dashboard/job-board" className="mt-4 inline-block bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg">
                    Back to Job Board
                </Link>
            </div>
        );
    }

    const canApply = currentUserId !== jobPost.userId;

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

                <div className="bg-card p-6 rounded-lg border max-w-4xl mx-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{jobPost.title}</h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                                {jobPost.rate && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {jobPost.rate}</span>}
                                {jobPost.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {jobPost.location}</span>}
                            </div>
                        </div>
                        {canApply && (
                            <button onClick={handleApply} disabled={isApplying || hasApplied} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                                {isApplying ? <Loader2 className="animate-spin" size={16}/> : hasApplied ? <CheckCircle size={16}/> : <Send size={16}/>}
                                {hasApplied ? 'Applied' : 'Apply Now'}
                            </button>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                        <p className="text-base whitespace-pre-wrap">{jobPost.description}</p>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {(jobPost.requiredSkills || []).map(skill => (
                                <span key={skill} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{skill}</span>
                            ))}
                        </div>
                    </div>

                     <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
                         <p>Job ID: {jobPost.id}</p>
                         <p>Posted On: {jobPost.createdAt ? format(new Date(jobPost.createdAt as any), 'MMM d, yyyy') : 'N/A'}</p>
                     </div>
                </div>
            </div>
        </>
    );
}