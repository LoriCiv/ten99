"use client";

import { useState, useEffect, useMemo } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { getJobPostings, getUserProfile, reportJobPost } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, Search, Briefcase, MapPin, Flag, Info, Building, Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useFirebase } from './FirebaseProvider';

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const JobPostCard = ({ post, onReportSuccess }: { post: JobPosting, onReportSuccess: () => void }) => {
    const [isReported, setIsReported] = useState(false);

    const handleReport = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isReported || !post.id) return;

        try {
            await reportJobPost(post.id);
            setIsReported(true);
            onReportSuccess();
        } catch (error) {
            console.error("Failed to report post:", error);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border hover:border-primary hover:shadow-lg transition-all flex flex-col h-full relative">
            <button 
                onClick={handleReport}
                disabled={isReported}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-destructive disabled:text-destructive disabled:cursor-not-allowed"
                title={isReported ? "Reported" : "Report Post"}
            >
                <Flag size={16} className={isReported ? 'fill-current' : ''} />
            </button>
            
            <div className="flex-grow pr-8">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-foreground mb-1">{post.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.jobType === 'Virtual' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                        {post.jobType || 'On-site'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                    {post.rate && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {post.rate}</span>}
                    {post.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {post.location}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-4 h-24 overflow-hidden text-ellipsis">
                    {post.description}
                </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex flex-wrap gap-2">
                    {(post.requiredSkills || []).map(skill => (
                        <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{skill}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function JobBoardPageContent({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase();
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [zipFilter, setZipFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [showMatchingOnly, setShowMatchingOnly] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isFirebaseAuthenticated && userId) {
            const unsubJobs = getJobPostings(setJobPostings);
            const unsubProfile = getUserProfile(userId, (profile) => {
                setUserProfile(profile);
                setIsLoading(false); 
            });

            return () => {
                unsubJobs();
                unsubProfile();
            };
        }
    }, [isFirebaseAuthenticated, userId]);

    const filteredJobs = useMemo(() => {
        const userSkills = userProfile?.skills || [];
        return jobPostings.filter(post => {
            if (showMatchingOnly && userSkills.length > 0) {
                const hasMatchingSkill = (post.requiredSkills || []).some(requiredSkill => userSkills.includes(requiredSkill));
                if (!hasMatchingSkill) {
                    return false;
                }
            }
            const searchLower = searchTerm.toLowerCase();
            const titleMatch = post.title.toLowerCase().includes(searchLower);
            const descMatch = post.description.toLowerCase().includes(searchLower);
            const zipMatch = !zipFilter || (post.zipCode || '').includes(zipFilter);
            const stateMatch = !stateFilter || post.state === stateFilter;

            return (titleMatch || descMatch) && zipMatch && stateMatch;
        });
    }, [jobPostings, searchTerm, zipFilter, stateFilter, showMatchingOnly, userProfile]);

    const handleReportSuccess = () => {
        setStatusMessage("Job post has been reported for review. Thank you.");
        setTimeout(() => setStatusMessage(null), 5000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-lg font-semibold mt-4">Loading Job Board...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {statusMessage && (
                <div className="fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 bg-sky-100 text-sky-800">
                    <Info size={20} />
                    <span>{statusMessage}</span>
                </div>
            )}
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Community Job Board</h1>
                        <p className="text-muted-foreground mt-1">Find your next gig or post an opportunity for the community.</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Link href="/dashboard/job-board/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                            <PlusCircle size={20}/> Post a Job
                        </Link>
                    </div>
                </header>
                
                <div className="mb-6 p-4 bg-card border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search Keywords</label>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g., Medical Interpreter, ASL" className="w-full pl-10 p-2 border rounded-md bg-background"/></div>
                        </div>
                        <div>
                            <label htmlFor="stateFilter" className="block text-sm font-medium text-muted-foreground mb-1">State</label>
                            <select id="stateFilter" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background">
                                <option value="">All States</option>
                                {usStates.map(state => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="zipFilter" className="block text-sm font-medium text-muted-foreground mb-1">Zip Code</label>
                            <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="zipFilter" type="text" value={zipFilter} onChange={(e) => setZipFilter(e.target.value)} placeholder="e.g., 90210" className="w-full pl-10 p-2 border rounded-md bg-background"/></div>
                        </div>
                        <div className="flex items-center space-x-2 justify-end self-center pb-2 col-span-full">
                            <label htmlFor="matching-jobs" className="text-sm font-medium">Show only jobs matching my skills</label>
                            <Switch id="matching-jobs" checked={showMatchingOnly} onCheckedChange={setShowMatchingOnly} />
                        </div>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
                    <Info size={20} className="text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        See an inappropriate post? Click the flag icon (<Flag size={14} className="inline-block" />) to report it.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map(post => (
                        <Link href={`/dashboard/job-board/${post.id}`} key={post.id} className="block h-full">
                            <JobPostCard post={post} onReportSuccess={handleReportSuccess} />
                        </Link>
                    ))}
                </div>
                {filteredJobs.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg">
                        <p className="font-semibold">No Jobs Found</p>
                        <p className="text-sm">Try adjusting your filters or check back later.</p>
                    </div>
                )}

                <div className="mt-12 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                <Building size={20}/> 
                                Introducing Ten25
                            </h3>
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">The Command Center for Agencies.</p>
                        </div>
                        <span className="text-xs font-semibold bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-1 rounded-full">COMING SOON</span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        The agency-side platform to post jobs, manage talent, track appointments, and handle payments in one integrated dashboard.
                    </p>
                    <a href="https://www.tenflow.app" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700">
                        Learn More
                    </a>
                </div>
            </div>
        </>
    );
}