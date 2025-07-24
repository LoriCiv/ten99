// src/components/JobDetailPageContent.tsx
"use client";

import { useState } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { sendJobApplicationMessage } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Tag, Mail, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JobDetailPageContentProps {
    jobPost: JobPosting;
    currentUserProfile: UserProfile | null;
    currentUserId: string;
}

export default function JobDetailPageContent({ jobPost, currentUserProfile, currentUserId }: JobDetailPageContentProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isApplied, setIsApplied] = useState(false);

    const isOwner = jobPost.userId === currentUserId;

    const handleBid = async () => {
        if (!currentUserProfile || isOwner) return;

        setIsLoading(true);
        try {
            await sendJobApplicationMessage(currentUserId, currentUserProfile, jobPost);
            setIsApplied(true);
            alert("Your application has been sent!");
        } catch (error) {
            console.error("Failed to send application:", error);
            alert("There was an error sending your application.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/job-board" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Board
            </Link>

            <div className="bg-card p-8 rounded-lg border max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{jobPost.title}</h1>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-md text-muted-foreground mt-2">
                           {jobPost.rate && <span className="flex items-center gap-1.5"><Briefcase size={16} /> {jobPost.rate}</span>}
                           {jobPost.location && <span className="flex items-center gap-1.5"><MapPin size={16} /> {jobPost.location} ({jobPost.zipCode})</span>}
                           {jobPost.contactEmail && <span className="flex items-center gap-1.5"><Mail size={16} /> {jobPost.contactEmail}</span>}
                        </div>
                    </div>
                    <div>
                        {isOwner ? (
                             <p className="text-sm font-semibold bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">This is your job post.</p>
                        ) : isApplied ? (
                            <button disabled className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                                <Check size={18} /> Applied
                            </button>
                        ) : (
                            <button onClick={handleBid} disabled={isLoading} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 w-full sm:w-auto justify-center">
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Bid on this Job'}
                            </button>
                        )}
                    </div>
                </div>
                
                <hr className="my-6" />

                <div>
                    <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{jobPost.description}</p>
                </div>

                {jobPost.requiredSkills && jobPost.requiredSkills.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                             {jobPost.requiredSkills.map(skill => (
                                <span key={skill} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2">
                                    <Tag size={14}/> {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}