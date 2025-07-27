"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobFile, Client } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile, uploadFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Save, Loader2, Paperclip, Upload, Star } from 'lucide-react';

interface JobFileDetailContentProps {
    initialJobFile: JobFile;
    initialClient: Client | null;
    userId: string;
}

export default function JobFileDetailContent({ initialJobFile, initialClient, userId }: JobFileDetailContentProps) {
    const router = useRouter();
    const [jobFile, setJobFile] = useState<JobFile>(initialJobFile);
    const [client] = useState<Client | null>(initialClient);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setJobFile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!jobFile.id) return;
        setIsSubmitting(true);
        try {
            const { id, createdAt, ...dataToUpdate } = jobFile;
            await updateJobFile(userId, id, dataToUpdate);
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
        if (!jobFile.id) return;
        if (window.confirm("Are you sure you want to delete this job file? This action cannot be undone.")) {
            try {
                await deleteJobFile(userId, jobFile.id);
                alert("Job file deleted.");
                router.push('/dashboard/job-files');
            } catch (error) {
                console.error("Error deleting job file:", error);
                alert("Failed to delete job file.");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !jobFile.id) return;
        setIsUploading(true);
        try {
            const downloadURL = await uploadFile(userId, selectedFile);
            const newAttachment = { name: selectedFile.name, url: downloadURL };
            const updatedAttachments = [...(jobFile.attachments || []), newAttachment];
            
            // Explicitly create the object to update to satisfy TypeScript
            const updateData: Partial<JobFile> = { attachments: updatedAttachments };
            await updateJobFile(userId, jobFile.id, updateData);

            setJobFile(prev => ({ ...prev, attachments: updatedAttachments }));
            setSelectedFile(null);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPriority = async (newPriority: 0 | 1 | 2) => {
        if (!jobFile.id) return;
        const finalPriority = jobFile.priority === newPriority ? 0 : newPriority;
        try {
            await updateJobFile(userId, jobFile.id, { priority: finalPriority });
            setJobFile(prev => ({ ...prev, priority: finalPriority }));
        } catch (error) {
            console.error("Error updating priority:", error);
        }
    };

    return (
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
                        {client && <p className="text-primary font-semibold">{client.name}</p>}
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
                        {/* ✅ FIX: Added explicit types for 'file' and 'index' to remove "implicit any" errors */}
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
    );
}