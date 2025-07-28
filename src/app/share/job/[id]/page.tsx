// src/app/share/job/[id]/page.tsx

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import type { JobFile, Client } from '@/types/app-interfaces';
import { notFound } from 'next/navigation';
import { Paperclip, CalendarDays, Building, FileText } from 'lucide-react';

// This is the real function to fetch a shared job file.
// It looks for a job file in a public collection where the 'publicId' matches.
const getPublicJobFile = async (publicId: string): Promise<JobFile | null> => {
    initializeFirebaseAdmin();
    const db = getFirestore();
    const jobFilesRef = db.collectionGroup('jobFiles');
    const q = jobFilesRef.where('publicId', '==', publicId).where('isShared', '==', true).limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as JobFile;
};

// This function can remain the same, fetching the client associated with the original user.
const getClientForJobFile = async (userId: string, clientId: string): Promise<Client | null> => {
    if (!userId || !clientId) return null;
    initializeFirebaseAdmin();
    const db = getFirestore();
    const clientRef = db.doc(`users/${userId}/clients/${clientId}`);
    const doc = await clientRef.get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Client : null;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// This is now an async Server Component
export default async function SharePage({ params }: { params: { id: string } }) {
    const publicId = params.id;
    if (!publicId) {
        notFound();
    }

    const jobFile = await getPublicJobFile(publicId);

    if (!jobFile || !jobFile.originalUserId) {
        notFound();
    }

    const client = await getClientForJobFile(jobFile.originalUserId, jobFile.clientId || '');

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