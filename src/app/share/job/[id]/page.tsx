// src/app/share/job/[id]/page.tsx
import { getPublicJobFile, getClientForJobFile } from '@/utils/firestoreService';
import { FileText, Building, Download } from 'lucide-react';

// ✅ 1. Define the correct props type for this page
interface SharedJobPageProps {
  params: {
    id: string; // Use 'id' to match the folder name [id]
  };
}

// ✅ 2. Use the correct type in the function signature
export default async function SharedJobPage({ params }: SharedJobPageProps) {
    const { id } = params; // Use 'id' here as well
    const jobFile = await getPublicJobFile(id);

    if (!jobFile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600">Job File Not Found</h1>
                    <p className="text-gray-600 mt-2">The link may be expired or incorrect.</p>
                </div>
            </div>
        );
    }

    const client = jobFile.clientId ? await getClientForJobFile(jobFile.originalUserId!, jobFile.clientId) : null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{jobFile.jobTitle}</h1>
                            <p className="text-md text-gray-500 mt-1">Shared via Ten99 App</p>
                        </div>
                        {jobFile.fileUrl && (
                            <a 
                                href={jobFile.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Download size={18} />
                                Download File
                            </a>
                        )}
                    </div>
                    
                    {client && (
                         <div className="mt-6 pt-6 border-t">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Building size={20}/> Client Information</h2>
                            <p className="text-gray-600 mt-2">{client.companyName || client.name}</p>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><FileText size={20}/> Shared Notes</h2>
                        <div className="mt-2 p-4 bg-gray-50 rounded-md">
                            <p className="text-gray-800 whitespace-pre-wrap">{jobFile.sharedNotes || "No shared notes for this file."}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}