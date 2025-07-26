"use client";

import { useState } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { sendJobApplicationMessage } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface JobDetailPageContentProps {
    jobPost: JobPosting;
    currentUserProfile: UserProfile | null;
    currentUserId: string;
}

export default function JobDetailPageContent({ jobPost, currentUserProfile, currentUserId }: JobDetailPageContentProps) {
    const [isApplying, setIsApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const handleApply = async () => {
        if (!currentUserProfile || !jobPost) return;
        setIsApplying(true);
        try {
            await sendJobApplicationMessage(currentUserId, currentUserProfile, jobPost);
            setHasApplied(true);
        } catch (error) {
            console.error("Failed to apply:", error);
            alert(`Error applying for job: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsApplying(false);
        }
    };
    
    const canApply = currentUserId !== jobPost.userId;

    return (
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
    );
}