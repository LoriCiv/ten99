// src/components/JobFileDetailPageContent.tsx
"use client";

// ✅ THE FIX: Added useEffect to the import line
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { JobFile, Client, Appointment, PersonalNetworkContact } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, CalendarDays, Share2, Paperclip } from 'lucide-react';
import JobFileForm from '@/components/JobFileForm';
import ShareModal from '@/components/ShareModal';

const TEMP_USER_ID = "dev-user-1";
const TEMP_USER_NAME = "Dev User";

interface JobFileDetailPageContentProps {
    initialJobFile: JobFile;
    initialClients: Client[];
    initialContacts: PersonalNetworkContact[];
    initialAppointments: Appointment[];
}

export default function JobFileDetailPageContent({ initialJobFile, initialClients, initialContacts, initialAppointments }: JobFileDetailPageContentProps) {
    const router = useRouter();
    const [jobFile, setJobFile] = useState<JobFile | null>(initialJobFile);
    const [clients] = useState<Client[]>(initialClients);
    const [contacts] = useState<PersonalNetworkContact[]>(initialContacts);
    const [appointments] = useState<Appointment[]>(initialAppointments);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'shared' | 'private'>('shared');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const jobFileId = initialJobFile.id!;

    useEffect(() => {
        setJobFile(initialJobFile);
    }, [initialJobFile]);

    const handleUpdate = async (updatedData: Partial<JobFile>) => {
        setIsSubmitting(true);
        try {
            await updateJobFile(TEMP_USER_ID, jobFileId, updatedData);
            alert("Job File updated!");
            setIsEditing(false);
            router.refresh(); 
        } catch (error) {
            console.error("Error updating job file:", error);
            alert("Failed to update job file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this job file? This cannot be undone.")) {
            try {
                await deleteJobFile(TEMP_USER_ID, jobFileId);
                alert("Job File deleted.");
                router.push('/dashboard/job-files');
            } catch (error) {
                console.error("Error deleting job file:", error);
                alert("Failed to delete job file.");
            }
        }
    };

    const formatDateRange = (startDate?: string, endDate?: string): string | null => {
        if (!startDate) return null;
        const start = new Date(startDate + 'T00:00:00');
        if (!endDate || startDate === endDate) {
            return start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        const end = new Date(endDate + 'T00:00:00');
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    if (!jobFile) return <div className="p-8 text-center text-red-500">Job File not found.</div>;

    if (isEditing) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <JobFileForm initialData={jobFile} clients={clients} appointments={appointments} onSave={handleUpdate} onCancel={() => setIsEditing(false)} isSubmitting={isSubmitting} />
            </div>
        );
    }

    const clientName = clients.find(c => c.id === jobFile.clientId)?.companyName || clients.find(c => c.id === jobFile.clientId)?.name || 'N/A';
    const dateRange = formatDateRange(jobFile.startDate, jobFile.endDate);

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <Link href="/dashboard/job-files" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6"> <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Job Files </Link>
                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{jobFile.jobTitle}</h1>
                            <p className="text-lg text-primary mt-1">{clientName}</p>
                            {dateRange && ( <div className="text-md text-muted-foreground mt-2 flex items-center gap-2"><CalendarDays size={16} /> <span>{dateRange}</span></div> )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsShareModalOpen(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80"><Share2 size={20}/></button>
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80"><Edit size={20}/></button>
                            <button onClick={handleDelete} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80"><Trash2 size={20}/></button>
                        </div>
                    </div>

                    {jobFile.fileUrl && (
                        <div className="mt-4 pt-4 border-t">
                             <a href={jobFile.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-semibold">
                                <Paperclip size={16} />
                                View Attached File
                            </a>
                        </div>
                    )}
                    
                    <div className="mt-6 pt-6 border-t">
                        <div className="border-b border-border"><nav className="-mb-px flex space-x-6" aria-label="Tabs"><button type="button" onClick={() => setActiveTab('shared')} className={`${activeTab === 'shared' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Shared Notes</button><button type="button" onClick={() => setActiveTab('private')} className={`${activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Private Notes</button></nav></div>
                        <div className="mt-4 prose prose-sm dark:prose-invert bg-background p-4 rounded-md min-h-[150px] whitespace-pre-wrap">
                            {activeTab === 'shared' ? (jobFile.sharedNotes || <p className="italic text-muted-foreground">No shared notes.</p>) : (jobFile.privateNotes || <p className="italic text-muted-foreground">No private notes.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            {isShareModalOpen && ( <ShareModal onClose={() => setIsShareModalOpen(false)} jobFile={jobFile} clientName={clientName} dateRange={dateRange} currentUserId={TEMP_USER_ID} currentUserName={TEMP_USER_NAME} clients={clients} contacts={contacts} /> )}
        </>
    );
}