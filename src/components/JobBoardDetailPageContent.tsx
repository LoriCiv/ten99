// src/components/JobBoardDetailPageContent.tsx
"use client";

import { useState } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { sendJobApplicationMessage } from '@/utils/firestoreService';
import { Button } from '@/components/ui/button';
import { Loader2, User, Calendar, MapPin, Globe, DollarSign, ThumbsUp, Info, X as XIcon } from 'lucide-react'; // ✅ 1. Import new icons
import Link from 'next/link';

interface JobBoardDetailPageContentProps {
    jobPost: JobPosting;
    posterProfile: UserProfile | null;
    userProfile: UserProfile | null;
    currentUserId: string | null;
}

const DetailItem = ({ icon: Icon, text }: { icon: React.ElementType, text?: string | null }) => {
    if (!text) return null;
    return (
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon size={16} />
            <span>{text}</span>
        </div>
    );
};

export default function JobBoardDetailPageContent({ jobPost, posterProfile, userProfile, currentUserId }: JobBoardDetailPageContentProps) {
    const [isApplying, setIsApplying] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState<string | null>(null); // ✅ 2. Add state for status messages

    const handleApply = async () => {
        if (!currentUserId || !userProfile) {
            setStatusMessage("You must be logged in and have a profile to apply.");
            return;
        }
        setIsApplying(true);
        setStatusMessage(null);
        try {
            await sendJobApplicationMessage(currentUserId, userProfile, jobPost);
            setApplicationStatus('success');
        } catch (error) {
            console.error("Error applying for job:", error);
            setApplicationStatus('error');
            setStatusMessage(`Error applying: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsApplying(false);
        }
    };
    
    const canApply = currentUserId && currentUserId !== jobPost.userId;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-card p-8 rounded-lg border">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{jobPost.title}</h1>
                        {posterProfile?.name && (
                            <Link href={`/profile/${jobPost.userId}`} className="text-lg text-primary hover:underline">
                                {posterProfile.name}
                            </Link>
                        )}
                    </div>
                    {applicationStatus === 'success' ? (
                        <div className="text-center p-4 bg-green-500/10 text-green-700 rounded-lg w-full md:w-auto">
                            <h3 className="font-semibold">Application Sent!</h3>
                            <p className="text-sm">The poster has been notified.</p>
                        </div>
                    ) : (
                        canApply && (
                            <Button onClick={handleApply} disabled={isApplying} size="lg">
                                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isApplying ? 'Applying...' : 'Apply Now'}
                            </Button>
                        )
                    )}
                </div>

                {/* ✅ 3. Display error messages here */}
                {statusMessage && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Info size={16} />
                            <span className="text-sm">{statusMessage}</span>
                        </div>
                        <button onClick={() => setStatusMessage(null)} className="p-1 rounded-full hover:bg-black/10"><XIcon size={16}/></button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold">Job Description</h2>
                        <p className="text-muted-foreground whitespace-pre-wrap">{jobPost.description}</p>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Details</h2>
                        <div className="space-y-3">
                            <DetailItem icon={DollarSign} text={jobPost.rate} />
                            <DetailItem icon={Calendar} text={jobPost.startDate ? `Starts: ${jobPost.startDate}` : undefined} />
                            <DetailItem icon={jobPost.jobType === 'Virtual' ? Globe : MapPin} text={jobPost.location || jobPost.jobType} />
                            <DetailItem icon={User} text={`Contact: ${jobPost.contactEmail}`} />
                        </div>
                        {jobPost.requiredSkills && jobPost.requiredSkills.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {jobPost.requiredSkills.map(skill => (
                                        <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}