// src/components/JobFilesPageContent.tsx
"use client";

import { useState, useMemo } from 'react'; // ✅ THE FIX: Removed unused 'useEffect'
import type { JobFile, Client } from '@/types/app-interfaces';
import Link from 'next/link';
import { FilePlus, Search, X, CalendarDays, Tag, Clock, CheckCircle, Star, Pin, PinOff } from 'lucide-react';
import { updateJobFile } from '@/utils/firestoreService';
import { Timestamp } from 'firebase/firestore';

interface JobFilesPageContentProps {
    jobFiles: JobFile[];
    clients: Client[];
    userId: string;
    initialClientFilter?: string; 
}

export default function JobFilesPageContent({
    jobFiles,
    clients,
    userId,
    initialClientFilter = ''
}: JobFilesPageContentProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState(initialClientFilter);
    const [tagFilter, setTagFilter] = useState('');

    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        jobFiles.forEach(file => {
            file.tags?.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }, [jobFiles]);

    const filteredJobFiles = useMemo(() => {
        const getSortableDate = (item: JobFile): number => {
            const createdAt = item.createdAt as Timestamp;
            if (!createdAt || typeof createdAt.toMillis !== 'function') {
                return 0;
            }
            return createdAt.toMillis();
        };

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
                const aPinned = a.isPinned ? 1 : 0;
                const bPinned = b.isPinned ? 1 : 0;
                if (aPinned !== bPinned) {
                    return bPinned - aPinned;
                }
                return getSortableDate(b) - getSortableDate(a);
            });
    }, [jobFiles, searchTerm, clientFilter, tagFilter, clients]);

    const handleTogglePin = async (e: React.MouseEvent, file: JobFile) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (!file.id) return;
        try {
            await updateJobFile(userId, file.id, { isPinned: !file.isPinned });
        } catch (error) {
            console.error("Error pinning file:", error);
            alert("Failed to update pin status.");
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
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-foreground">Job Files</h1>
                <Link href={`/dashboard/job-files/new?clientId=${clientFilter}`} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                    <FilePlus size={20}/> New Job File
                </Link>
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
                            <button 
                                onClick={(e) => handleTogglePin(e, file)} 
                                className={`absolute top-2 right-2 p-1 rounded-full hover:bg-secondary ${file.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                {file.isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                            </button>
                            
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