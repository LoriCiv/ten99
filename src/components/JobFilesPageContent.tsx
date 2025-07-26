"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { JobFile, Client } from '@/types/app-interfaces';
import { getJobFiles, getClients, updateJobFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { FilePlus, Search, X, CalendarDays, Tag, Clock, CheckCircle, Star } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface JobFilesPageContentProps {
    userId: string;
}

const PriorityStars = ({ priority, onClick }: { priority: number, onClick: (newPriority: number) => void }) => {
    return (
        <div className="flex" onClick={(e) => e.stopPropagation()}>
            {[1, 2].map((starValue) => (
                <button
                    key={starValue}
                    onClick={(e) => {
                        e.preventDefault();
                        const newPriority = priority === starValue ? 0 : starValue;
                        onClick(newPriority);
                    }}
                    className={`p-1 ${priority >= starValue ? 'text-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-400'}`}
                    title={`Set priority to ${starValue}`}
                >
                    <Star size={18} fill={priority >= starValue ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
};

function JobFilesPageContentInternal({ userId }: JobFilesPageContentProps) {
    const searchParams = useSearchParams();
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');

    useEffect(() => {
        const initialFilter = searchParams.get('clientId');
        if (initialFilter) {
            setClientFilter(initialFilter);
        }
    }, [searchParams]);

    useEffect(() => {
        const unsubJobFiles = getJobFiles(userId, (data) => {
            setJobFiles(data);
            setIsLoading(false);
        });
        const unsubClients = getClients(userId, setClients);

        return () => {
            unsubJobFiles();
            unsubClients();
        };
    }, [userId]);

    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        if (Array.isArray(jobFiles)) {
            jobFiles.forEach(file => {
                file.tags?.forEach(tag => tagsSet.add(tag));
            });
        }
        return Array.from(tagsSet).sort();
    }, [jobFiles]);

    const filteredJobFiles = useMemo(() => {
        const getSortableDate = (item: JobFile): number => {
            const createdAt = item.createdAt as Timestamp;
            if (!createdAt || typeof createdAt.toMillis !== 'function') { return 0; }
            return createdAt.toMillis();
        };

        if (!Array.isArray(jobFiles)) { return []; }

        return jobFiles
            .filter(file => {
                const clientMatch = !clientFilter || file.clientId === clientFilter;
                const tagMatch = !tagFilter || (file.tags && file.tags.includes(tagFilter));
                const searchMatch = !searchTerm ||
                    file.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (clients.find(c => c.id === file.clientId)?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (clients.find(c => c.id === file.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                return clientMatch && searchMatch && tagMatch;
            })
            .sort((a, b) => {
                const aPriority = a.priority || 0;
                const bPriority = b.priority || 0;
                if (aPriority !== bPriority) { return bPriority - aPriority; }
                return getSortableDate(b) - getSortableDate(a);
            });
    }, [jobFiles, searchTerm, clientFilter, tagFilter, clients]);

    const handleSetPriority = async (file: JobFile, newPriority: number) => {
        if (!file.id) return;
        try {
            await updateJobFile(userId, file.id, { priority: newPriority });
        } catch (error) {
            console.error("Error setting priority:", error);
            alert("Failed to update priority status.");
        }
    };
    
    const getClientName = (clientId?: string) => {
        if (!clientId) return 'N/A';
        const client = clients.find(c => c.id === clientId);
        return client?.companyName || client?.name || 'Unknown Client';
    };

    const formatDateRange = (startDate?: string, endDate?: string) => {
        if (!startDate) return null;
        const start = new Date(startDate + 'T00:00:00');
        if (!endDate || startDate === endDate) {
            return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const end = new Date(endDate + 'T00:00:00');
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };
    
    const getJobStatus = (startDate?: string, endDate?: string) => {
        if (!startDate) return { text: 'General File', icon: Star, color: 'text-gray-500' };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startDate + 'T00:00:00');
        const end = endDate ? new Date(endDate + 'T00:00:00') : start;

        if (end < today) return { text: 'Completed', icon: CheckCircle, color: 'text-green-500' };
        if (start > today) return { text: 'Upcoming', icon: CalendarDays, color: 'text-blue-500' };
        return { text: 'In Progress', icon: Clock, color: 'text-yellow-500' };
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Job Files...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Job Files</h1>
                    <p className="text-muted-foreground mt-1">Organize all your project-related documents and notes.</p>
                </div>
                <div className="mt-4 flex justify-end">
                    <Link href={`/dashboard/job-files/new?clientId=${clientFilter}`} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                        <FilePlus size={20}/> New Job File
                    </Link>
                </div>
            </header>
            
            <div className="mb-6 p-4 bg-card border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Title or Client..." className="w-full pl-10 p-2 border rounded-md bg-background"/></div></div>
                    <div><label htmlFor="clientFilter" className="block text-sm font-medium text-muted-foreground mb-1">Client</label><select id="clientFilter" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background"><option value="">All Clients</option>{clients.map(client => (<option key={client.id} value={client.id!}>{client.companyName || client.name}</option>))}</select></div>
                    <div><label htmlFor="tagFilter" className="block text-sm font-medium text-muted-foreground mb-1">Tag</label><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><select id="tagFilter" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="w-full pl-10 p-2 border rounded-md bg-background appearance-none"><option value="">All Tags</option>{allTags.map(tag => (<option key={tag} value={tag}>{tag}</option>))}</select>{tagFilter && (<button onClick={() => setTagFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={18} /></button>)}</div></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobFiles.map(file => {
                    if (!file.id) return null;
                    const dateRange = formatDateRange(file.startDate, file.endDate);
                    const status = getJobStatus(file.startDate, file.endDate);
                    const StatusIcon = status.icon;

                    return (
                        <Link href={`/dashboard/job-files/${file.id}`} key={file.id} className="relative bg-card p-6 rounded-lg border hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between min-h-[160px]">
                            <div className="absolute top-2 right-2">
                                <PriorityStars 
                                    priority={file.priority || 0} 
                                    onClick={(newPriority) => handleSetPriority(file, newPriority)} 
                                />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-foreground truncate pr-8">{file.jobTitle}</h3>
                                <p className="text-primary truncate">{getClientName(file.clientId)}</p>
                                {file.tags && file.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {file.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/20 flex flex-col items-start gap-1">
                                 <div className="flex items-center gap-2">
                                     <StatusIcon className={`h-4 w-4 ${status.color}`} />
                                     <span className={`font-semibold ${status.color}`}>{status.text}</span>
                                 </div>
                                 {dateRange && <span>{dateRange}</span>}
                            </div>
                        </Link>
                    );
                })}
            </div>
            {filteredJobFiles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No job files found.</p>
                </div>
            )}
        </div>
    );
}

// Wrapper component to handle Suspense for search params
export default function JobFilesPageContent({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <JobFilesPageContentInternal userId={userId} />
        </Suspense>
    );
}