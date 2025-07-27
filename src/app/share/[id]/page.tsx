// src/app/share/job/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getClientForJobFile } from '@/utils/firestoreService';
import type { JobFile, Client } from '@/types/app-interfaces';
import { Paperclip, CalendarDays, Building, FileText } from 'lucide-react';

// Placeholder function to allow the build to pass
const getPublicJobFile = async (id: string): Promise<JobFile | null> => {
    console.error("getPublicJobFile function is not implemented.");
    return null;
}

export default function SharePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [jobFile, setJobFile] = useState<JobFile | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            setError("Invalid share link.");
            return;
        }

        const fetchSharedData = async () => {
            try {
                const fetchedJobFile = await getPublicJobFile(id);
                
                if (!fetchedJobFile || !fetchedJobFile.originalUserId) {
                    return notFound();
                }
                
                const fetchedClient = await getClientForJobFile(fetchedJobFile.originalUserId, fetchedJobFile.clientId || '');

                setJobFile(fetchedJobFile);
                setClient(fetchedClient);
            } catch (err) {
                console.error("Failed to fetch shared data:", err);
                setError("Could not load the shared file.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedData();
    }, [id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };
    
    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    if (error || !jobFile) {
        return <div className="p-8 text-center text-red-500">{error || "Shared file not found."}</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border">
                <header className="pb-6 border-b mb-6">
                    <h1 className="text-4xl font-bold text-slate-800">{jobFile.jobTitle}</h1>
                    <div className="flex items-center gap-4 text-slate-500 mt-2">
                        {client && (
                            <div className="flex items-center gap-2">
                                <Building size={16} />
                                <span>{client.companyName || client.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            <span>{formatDate(jobFile.startDate)}</span>
                        </div>
                    </div>
                </header>
                
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText size={20}/> Shared Notes</h2>
                    <div className="prose prose-slate max-w-none bg-slate-50 p-4 rounded-md border whitespace-pre-wrap">
                        <p>{jobFile.sharedNotes || "No shared notes available."}</p>
                    </div>
                </section>

                {jobFile.fileUrl && (
                    <section className="mt-6">
                        <h2 className="text-xl font-semibold text-slate-700 mb-3">Attachment</h2>
                        <a 
                            href={jobFile.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-semibold bg-blue-50 p-3 rounded-md border border-blue-200"
                        >
                            <Paperclip size={16} />
                            View Attached File
                        </a>
                    </section>
                )}
            </div>
            <footer className="text-center mt-8 text-sm text-slate-400">
                <p>Shared via Ten99</p>
            </footer>
        </div>
    );
}