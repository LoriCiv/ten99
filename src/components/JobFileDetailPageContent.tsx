"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { JobFile, Client, Appointment, PersonalNetworkContact } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile } from '@/utils/firestoreService';
import { ArrowLeft, Edit, Trash2, CalendarDays, Share2, Paperclip, ThumbsUp, Info, X } from 'lucide-react';
import JobFileForm from '@/components/JobFileForm';
import ShareModal from '@/components/ShareModal';

// A non-blocking confirmation dialog for actions like deleting.
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md border p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground my-4">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-muted text-muted-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted/80">Cancel</button>
                <button onClick={onConfirm} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90">Confirm</button>
            </div>
        </div>
    </div>
);

// Props this component receives from its parent Server Page
interface JobFileDetailPageContentProps {
    initialJobFile: JobFile;
    initialClients: Client[];
    initialContacts: PersonalNetworkContact[];
    initialAppointments: Appointment[];
    userId: string;
    currentUserName: string;
}

export default function JobFileDetailPageContent({
    initialJobFile,
    initialClients,
    initialContacts,
    initialAppointments,
    userId,
    currentUserName
}: JobFileDetailPageContentProps) {
    const router = useRouter();
    const [jobFile, setJobFile] = useState<JobFile>(initialJobFile);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'shared' | 'private'>('shared');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // When the initial data from the server changes, update our local state
    useEffect(() => {
        setJobFile(initialJobFile);
    }, [initialJobFile]);

    // Function to show a temporary success or error message
    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    // This function is passed to the JobFileForm for saving changes
    const handleUpdate = async (updatedData: Partial<JobFile>) => {
        if (!jobFile?.id) return;
        setIsSubmitting(true);
        try {
            await updateJobFile(userId, jobFile.id, updatedData);
            // Update local state immediately for a responsive feel
            setJobFile(prev => ({ ...prev, ...updatedData }));
            showStatusMessage("success", "Job File updated successfully!");
            setIsEditing(false); // Exit editing mode
            router.refresh(); // Tell Next.js to re-fetch data from the server
        } catch (error) {
            console.error("Error updating job file:", error);
            showStatusMessage("error", "Failed to update job file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // This function shows the confirmation modal before deleting
    const handleDelete = () => {
        if (!jobFile?.id) return;
        setConfirmation({
            title: "Delete Job File?",
            message: "Are you sure? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await deleteJobFile(userId, jobFile.id!);
                    // Use router to navigate away after deletion
                    router.push('/dashboard/job-files');
                } catch (error) {
                    console.error("Error deleting job file:", error);
                    showStatusMessage("error", "Failed to delete job file.");
                }
                setConfirmation(null);
            }
        });
    };

    // Helper to format date ranges nicely
    const formatDateRange = (startDate?: string, endDate?: string): string | null => {
        if (!startDate) return null;
        const start = new Date(startDate + 'T00:00:00');
        if (!endDate || startDate === endDate) {
            return start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        const end = new Date(endDate + 'T00:00:00');
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    // If the user clicks "Edit", we show the JobFileForm component
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
                    userId={userId}
                />
            </div>
        );
    }

    // Otherwise, we show the main detail view
    const clientName = initialClients.find(c => c.id === jobFile.clientId)?.companyName || initialClients.find(c => c.id === jobFile.clientId)?.name || 'N/A';
    const dateRange = formatDateRange(jobFile.startDate, jobFile.endDate);

    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="p-1 rounded-full hover:bg-black/10"><X size={16} /></button>
                </div>
            )}

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
                            <button onClick={() => setIsShareModalOpen(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80" title="Share"><Share2 size={20} /></button>
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80" title="Edit"><Edit size={20} /></button>
                            <button onClick={handleDelete} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80" title="Delete"><Trash2 size={20} /></button>
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
                        <div className="border-b border-border">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button type="button" onClick={() => setActiveTab('shared')} className={`${activeTab === 'shared' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Shared Notes</button>
                                <button type="button" onClick={() => setActiveTab('private')} className={`${activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Private Notes</button>
                            </nav>
                        </div>
                        <div className="mt-4 prose prose-sm dark:prose-invert bg-background p-4 rounded-md min-h-[150px] whitespace-pre-wrap">
                            {activeTab === 'shared' ? (jobFile.sharedNotes || <p className="italic text-muted-foreground">No shared notes.</p>) : (jobFile.privateNotes || <p className="italic text-muted-foreground">No private notes.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            {isShareModalOpen && (
                <ShareModal
                    onClose={() => setIsShareModalOpen(false)}
                    jobFile={jobFile}
                    clientName={clientName}
                    currentUserId={userId}
                    currentUserName={currentUserName}
                    clients={initialClients}
                    contacts={initialContacts}
                />
            )}
        </>
    );
}