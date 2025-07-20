// src/app/share/[id]/page.tsx

import { getPublicJobFile, getClientForJobFile } from '@/utils/firestoreService';
import type { JobFile, Client } from '@/types/app-interfaces';
import { Briefcase, Building, FileText } from 'lucide-react';

// This is a Server Component that fetches data directly from the database
export default async function PublicJobFilePage({ params }: { params: { id: string } }) {
    const publicId = params.id;
    const jobFile: JobFile | null = await getPublicJobFile(publicId);

    let client: Client | null = null;
    if (jobFile?.originalUserId && jobFile.clientId) {
        client = await getClientForJobFile(jobFile.originalUserId, jobFile.clientId);
    }

    if (!jobFile) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-50 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md border">
                    <h1 className="text-2xl font-bold text-destructive">File Not Found</h1>
                    <p className="text-muted-foreground mt-2">The share link is invalid or the file has been removed.</p>
                </div>
            </main>
        );
    }
    
    const clientName = client?.companyName || client?.name || 'Client Information Not Available';

    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-md border">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                    <Briefcase className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Shared Job File</h1>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground">{jobFile.jobTitle}</h2>
                        <div className="flex items-center text-muted-foreground mt-2">
                            <Building size={16} className="mr-2" />
                            <span>{clientName}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                            <FileText size={18} className="mr-2" />
                            Shared Notes
                        </h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-background p-4 rounded-md border whitespace-pre-wrap">
                            {jobFile.sharedNotes ? jobFile.sharedNotes : <p className="italic">No shared notes were included.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-muted-foreground text-sm">
                <p>Shared via the Ten99 App</p>
            </footer>
        </main>
    );
}