// src/components/JobFileDetailPageContent.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { JobFile, Client, Appointment, PersonalNetworkContact, UserProfile } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile, uploadFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, CalendarDays, Share2, Paperclip, Upload, Loader2 } from 'lucide-react';
import JobFileForm from '@/components/JobFileForm';
import ShareModal from '@/components/ShareModal';
import { useFirebase } from '@/components/FirebaseProvider';

export default function JobFileDetailPageContent({ 
    initialJobFile, 
    initialClients, 
    initialContacts, 
    initialAppointments,
    userId 
}: {
    initialJobFile: JobFile;
    initialClients: Client[];
    initialContacts: PersonalNetworkContact[];
    initialAppointments: Appointment[];
    userId: string;
}) {
    const { userProfile } = useFirebase();
    const router = useRouter();
    const [jobFile, setJobFile] = useState<JobFile>(initialJobFile);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'shared' | 'private'>('shared');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setJobFile(initialJobFile);
    }, [initialJobFile]);

    const handleUpdate = async (updatedData: Partial<JobFile>) => {
        if (!jobFile?.id) return;
        setIsSubmitting(true);
        try {
            await updateJobFile(userId, jobFile.id, updatedData);
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
        if (!jobFile?.id) return;
        if (window.confirm("Are you sure you want to delete this job file? This cannot be undone.")) {
            try {
                await deleteJobFile(userId, jobFile.id);
                alert("Job File deleted.");
                router.push('/dashboard/job-files');
            } catch (error) {
                console.error("Error deleting job file:", error);
                alert("Failed to delete job file.");
            }
        }
    };
    
    const handleFileUpload = async () => {
        if (!fileToUpload || !jobFile.id) return;
        setIsUploading(true);
        try {
            const downloadURL = await uploadFile(userId, fileToUpload);
            const newAttachment = { name: fileToUpload.name, url: downloadURL };
            const updatedAttachments = [...(jobFile.attachments || []), newAttachment];
            await updateJobFile(userId, jobFile.id, { attachments: updatedAttachments });
            setFileToUpload(null);
            router.refresh();
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const formatDateRange = (startDate?: string, endDate?: string): string | null => {
        if (!startDate) return null;
        const start = new Date(startDate + 'T00:00:00');
        if (!endDate || startDate === endDate) return start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const end = new Date(endDate + 'T00:00:00');
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    if (isEditing) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <JobFileForm 
                    initialData={jobFile} 
                    clients={initialClients} 
                    appointments={initialAppointments} 
                    onSave={handleUpdate} 
                    onCancel={() => setIsEditing(false)} 
                    isSubmitting={isSubmitting} 
                />
            </div>
        );
    }

    const clientName = initialClients.find(c => c.id === jobFile.clientId)?.companyName || initialClients.find(c => c.id === jobFile.clientId)?.name || 'N/A';
    const dateRange = formatDateRange(jobFile.startDate, jobFile.endDate);

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <Link href="/dashboard/job-files" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Job Files
                </Link>
                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{jobFile.jobTitle}</h1>
                            <p className="text-lg text-primary mt-1">{clientName}</p>
                            {dateRange && (
                                <div className="text-md text-muted-foreground mt-2 flex items-center gap-2">
                                    <CalendarDays size={16} /> <span>{dateRange}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsShareModalOpen(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80" title="Share Job File"><Share2 size={20}/></button>
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80" title="Edit Job File"><Edit size={20}/></button>
                            <button onClick={handleDelete} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80" title="Delete Job File"><Trash2 size={20}/></button>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                        {jobFile.attachments && jobFile.attachments.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {jobFile.attachments.map((file, index) => (
                                    <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline font-semibold">
                                        <Paperclip size={16} /> {file.name}
                                    </a>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input type="file" onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            <button onClick={handleFileUpload} disabled={!fileToUpload || isUploading} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-1 px-3 rounded-lg hover:bg-secondary/80 text-sm disabled:opacity-50">
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                        <div className="border-b border-border">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button type="button" onClick={() => setActiveTab('shared')} className={`${activeTab === 'shared' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Shared Notes</button>
                                <button type="button" onClick={() => setActiveTab('private')} className={`${activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Private Notes</button>
                            </nav>
                        </div>
                        <div className="mt-4 prose prose-sm dark:prose-invert max-w-none bg-background p-4 rounded-md min-h-[150px] whitespace-pre-wrap">
                            {activeTab === 'shared' ? (jobFile.sharedNotes || <p className="italic text-muted-foreground">No shared notes.</p>) : (jobFile.privateNotes || <p className="italic text-muted-foreground">No private notes.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            {isShareModalOpen && userProfile && ( <ShareModal onClose={() => setIsShareModalOpen(false)} jobFile={jobFile} clientName={clientName} currentUserId={userId} currentUserName={userProfile.name || 'A Ten99 User'} clients={initialClients} contacts={initialContacts} /> )}
        </>
    );
}