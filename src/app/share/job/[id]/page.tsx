// src/app/share/job/[id]/page.tsx

import { adminDb } from '@/lib/firebase-admin'; // ✅ Correct import
import type { JobPosting } from '@/types/app-interfaces'; // This page shares JobPostings, not JobFiles
import { notFound } from 'next/navigation';
import { CalendarDays, Building, FileText, MapPin } from 'lucide-react';

// Function to fetch a public job posting from the top-level 'jobPostings' collection.
const getPublicJobPosting = async (publicId: string): Promise<JobPosting | null> => {
    const db = adminDb; // ✅ Use the imported adminDb directly
    const jobRef = db.collection('jobPostings').doc(publicId);
    const doc = await jobRef.get();

    if (!doc.exists) {
        return null;
    }
    
    return { id: doc.id, ...doc.data() } as JobPosting;
};

const formatDate = (timestamp?: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// This is an async Server Component for sharing a specific job post.
export default async function ShareJobPage({ params }: { params: { id:string } }) {
    const publicId = params.id;
    if (!publicId) {
        notFound();
    }

    const jobPost = await getPublicJobPosting(publicId);

    if (!jobPost) {
        notFound();
    }

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border">
                <header className="pb-6 border-b mb-6">
                    <h1 className="text-4xl font-bold text-slate-800">{jobPost.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 mt-3">
                        {jobPost.companyName && (
                            <div className="flex items-center gap-2">
                                <Building size={16} />
                                <span>{jobPost.companyName}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{jobPost.location || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            <span>Posted on {formatDate(jobPost.createdAt)}</span>
                        </div>
                    </div>
                </header>
                
                <section>
                    <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText size={20}/> Job Description</h2>
                    <div className="prose prose-slate max-w-none bg-slate-50 p-4 rounded-md border whitespace-pre-wrap">
                        <p>{jobPost.description || "No description available."}</p>
                    </div>
                </section>

            </div>
            <footer className="text-center mt-8 text-sm text-slate-400">
                <p>Job Posting shared via Ten99</p>
            </footer>
        </div>
    );
}