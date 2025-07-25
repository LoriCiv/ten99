"use client";

import { useState, useEffect, useMemo } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { getJobPostings, getUserProfile, reportJobPost } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, Search, Briefcase, MapPin, Tag, Flag } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

const TEMP_USER_ID = "dev-user-1";

const JobPostCard = ({ post }: { post: JobPosting }) => {
    const [isReported, setIsReported] = useState(false);

    const handleReport = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isReported || !post.id) return;

        try {
            await reportJobPost(post.id);
            setIsReported(true);
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
                     {post.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {post.location} ({post.zipCode})</span>}
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


export default function JobBoardPage() {
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [zipFilter, setZipFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [showMatchingOnly, setShowMatchingOnly] = useState(false);

    useEffect(() => {
        const unsubJobs = getJobPostings((posts) => {
            setJobPostings(posts);
            setIsLoading(false);
        });
        const unsubProfile = getUserProfile(TEMP_USER_ID, setUserProfile);

        return () => {
            unsubJobs();
            unsubProfile();
        };
    }, []);

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
            const skillLower = skillFilter.toLowerCase();
            const titleMatch = post.title.toLowerCase().includes(searchLower);
            const descMatch = post.description.toLowerCase().includes(searchLower);
            const zipMatch = !zipFilter || (post.zipCode || '').includes(zipFilter);
            const manualSkillMatch = !skillFilter || (post.requiredSkills || []).some(skill => skill.toLowerCase().includes(skillLower));
            return (titleMatch || descMatch) && zipMatch && manualSkillMatch;
        });
    }, [jobPostings, searchTerm, zipFilter, skillFilter, showMatchingOnly, userProfile]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Job Board...</div>;
    }

    return (
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search Title/Desc</label>
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g., Medical" className="w-full pl-10 p-2 border rounded-md bg-background"/></div>
                    </div>
                    <div>
                        <label htmlFor="zipFilter" className="block text-sm font-medium text-muted-foreground mb-1">Zip Code</label>
                        <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="zipFilter" type="text" value={zipFilter} onChange={(e) => setZipFilter(e.target.value)} placeholder="e.g., 90210" className="w-full pl-10 p-2 border rounded-md bg-background"/></div>
                    </div>
                    <div>
                        <label htmlFor="skillFilter" className="block text-sm font-medium text-muted-foreground mb-1">Skill / Tag</label>
                        <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="skillFilter" type="text" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} placeholder="e.g., ASL" className="w-full pl-10 p-2 border rounded-md bg-background"/></div>
                    </div>
                    <div className="flex items-center space-x-2 justify-end">
                        <label htmlFor="matching-jobs" className="text-sm font-medium text-muted-foreground">Show Matching Jobs Only</label>
                        <Switch id="matching-jobs" checked={showMatchingOnly} onCheckedChange={setShowMatchingOnly} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(post => (
                    <Link href={`/dashboard/job-board/${post.id}`} key={post.id} className="block h-full">
                         <JobPostCard post={post} />
                    </Link>
                ))}
            </div>
            {filteredJobs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg">
                    <p className="font-semibold">No Jobs Found</p>
                    <p className="text-sm">Try adjusting your filters or check back later.</p>
                </div>
            )}
        </div>
    );
}