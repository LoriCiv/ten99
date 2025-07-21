// src/app/share/[id]/page.tsx
import { getPublicJobFile, getClientForJobFile } from '@/utils/firestoreService';
import { notFound } from 'next/navigation';
import { Paperclip, CalendarDays, User, Building, FileText } from 'lucide-react';

interface SharePageProps {
    params: {
        id: string;
    };
}

// ✅ THE FIX: Added the 'async' keyword here
export default async function SharePage({ params }: SharePageProps) {
    const publicId = params.id;
    const jobFile = await getPublicJobFile(publicId);

    if (!jobFile || !jobFile.originalUserId) {
        notFound();
    }

    const client = await getClientForJobFile(jobFile.originalUserId, jobFile.clientId || '');

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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
                    <div className="prose prose-slate max-w-none bg-slate-50 p-4 rounded-md border">
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