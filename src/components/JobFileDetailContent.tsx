// src/components/JobFileDetailContent.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { JobFile, Client } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile, uploadFile, getJobFile, getClientForJobFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Save, Loader2, Paperclip, Upload, Star, ThumbsUp, Info, X } from 'lucide-react';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook

// ✅ New component for confirmation dialogs
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

interface JobFileDetailContentProps {
    userId: string;
    jobFileId: string;
}

export default function JobFileDetailContent({ userId, jobFileId }: JobFileDetailContentProps) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const router = useRouter();
    const [jobFile, setJobFile] = useState<JobFile | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ Job File Detail page is authenticated, fetching data...");
            getJobFile(userId, jobFileId).then(jobFileDoc => {
                if (jobFileDoc) {
                    setJobFile(jobFileDoc);
                    if (jobFileDoc.clientId) {
                        getClientForJobFile(userId, jobFileDoc.clientId).then(clientDoc => {
                            setClient(clientDoc);
                            setIsLoading(false);
                        });
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    // Handle case where job file is not found
                    setIsLoading(false);
                }
            });
        }
    }, [isFirebaseAuthenticated, userId, jobFileId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!jobFile) return;
        const { name, value } = e.target;
        setJobFile(prev => ({ ...prev!, [name]: value }));
    };

    const handleSave = async () => {
        if (!jobFile?.id) return;
        setIsSubmitting(true);
        try {
            const { id, createdAt, ...dataToUpdate } = jobFile;
            await updateJobFile(userId, id, dataToUpdate);
            setIsEditing(false);
            showStatusMessage("success", "Job file updated!");
        } catch (error) {
            console.error("Error updating job file:", error);
            showStatusMessage("error", "Failed to update job file.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = () => {
        if (!jobFile?.id) return;
        setConfirmation({
            title: "Delete Job File?",
            message: "Are you sure you want to delete this job file? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await deleteJobFile(userId, jobFile.id!);
                    router.push('/dashboard/job-files');
                } catch (error) {
                    console.error("Error deleting job file:", error);
                    showStatusMessage("error", "Failed to delete job file.");
                }
                setConfirmation(null);
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !jobFile?.id) return;
        setIsUploading(true);
        try {
            const downloadURL = await uploadFile(userId, selectedFile);
            const newAttachment = { name: selectedFile.name, url: downloadURL };
            const updatedAttachments = [...(jobFile.attachments || []), newAttachment];
            
            const updateData: Partial<JobFile> = { attachments: updatedAttachments };
            await updateJobFile(userId, jobFile.id, updateData);

            setJobFile(prev => ({ ...prev!, attachments: updatedAttachments }));
            setSelectedFile(null);
            showStatusMessage("success", "File uploaded successfully!");
        } catch (error) {
            console.error("Error uploading file:", error);
            showStatusMessage("error", "File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPriority = async (newPriority: 0 | 1 | 2) => {
        if (!jobFile?.id) return;
        const finalPriority = jobFile.priority === newPriority ? 0 : newPriority;
        try {
            await updateJobFile(userId, jobFile.id, { priority: finalPriority });
            setJobFile(prev => ({ ...prev!, priority: finalPriority }));
        } catch (error) {
            console.error("Error updating priority:", error);
        }
    };

    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Job File...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching data...</p>
               </div>
           </div>
        );
    }

    if (!jobFile) {
        return (
             <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Job File Not Found</h2>
                <p className="text-muted-foreground mt-2">This file may have been deleted or the link is incorrect.</p>
                <Link href="/dashboard/job-files" className="mt-4 inline-block bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg">
                    Back to Job Files
                </Link>
            </div>
        );
    }

    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="p-1 rounded-full hover:bg-black/10"><X size={16}/></button>
                </div>
            )}
            <div className="p-4 sm:p-6 lg:p-8">
                <Link href="/dashboard/job-files" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Job Files
                </Link>

                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            {isEditing ? (
                                <input
                                    name="jobTitle"
                                    value={jobFile.jobTitle}
                                    onChange={handleInputChange}
                                    className="text-3xl font-bold bg-background border rounded-md p-2 -ml-2"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-foreground">{jobFile.jobTitle}</h1>
                            )}
                            {client && <p className="text-primary font-semibold">{client.name || client.companyName}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2].map((p) => (
                                    <button key={p} onClick={() => handleSetPriority(p as 1 | 2)}>
                                        <Star size={20} className={jobFile.priority && jobFile.priority >= p ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}/>
                                    </button>
                                ))}
                            </div>
                            {isEditing ? (
                                <>
                                    <button onClick={handleSave} disabled={isSubmitting} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="text-sm font-semibold">Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-muted rounded-md"><Edit size={16}/></button>
                                    <button onClick={handleDelete} className="p-2 hover:bg-muted rounded-md text-destructive"><Trash2 size={16}/></button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Private Notes</h3>
                        {isEditing ? (
                           <textarea
                                name="privateNotes"
                                value={jobFile.privateNotes || ''}
                                onChange={handleInputChange}
                                rows={10}
                                className="w-full p-3 bg-background border rounded-md"
                           />
                        ) : (
                            <div className="prose dark:prose-invert max-w-none p-3 bg-background rounded-md min-h-[100px] whitespace-pre-wrap">
                                {jobFile.privateNotes || <span className="text-muted-foreground">No private notes for this job file.</span>}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                        <div className="space-y-3">
                            {(jobFile.attachments || []).map((file: { url: string; name: string }, index: number) => (
                                <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background rounded-md border hover:border-primary">
                                    <Paperclip size={16} />
                                    <span className="font-medium text-primary underline">{file.name}</span>
                                </a>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <input type="file" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                            <button onClick={handleFileUpload} disabled={!selectedFile || isUploading} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                                  {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>} Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}