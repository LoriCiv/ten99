"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { JobFile, Client, PersonalNetworkContact, Appointment } from '@/types/app-interfaces';
import { updateJobFile, deleteJobFile, uploadFile } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Download } from 'lucide-react';
import JobFileForm from './JobFileForm';
import Modal from './Modal';

interface JobFileDetailPageContentProps {
    initialJobFile: JobFile;
    initialClients: Client[];
    initialContacts: PersonalNetworkContact[];
    initialAppointments: Appointment[];
    userId: string;
}

export default function JobFileDetailPageContent({
    initialJobFile,
    initialClients,
    initialContacts,
    initialAppointments,
    userId
}: JobFileDetailPageContentProps) {
    const router = useRouter();
    const [jobFile, setJobFile] = useState(initialJobFile);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const client = useMemo(() => initialClients.find(c => c.id === jobFile.clientId), [initialClients, jobFile.clientId]);
    const appointment = useMemo(() => initialAppointments.find(a => a.id === jobFile.appointmentId), [initialAppointments, jobFile.appointmentId]);

    const handleSave = async (data: Partial<JobFile>, fileToUpload: File | null) => {
        if (!jobFile.id) return;
        setIsSubmitting(true);
        let updatedData = { ...data };

        try {
            if (fileToUpload) {
                const downloadURL = await uploadFile(userId, fileToUpload);
                updatedData.fileUrl = downloadURL;
            }
            await updateJobFile(userId, jobFile.id, updatedData);
            setJobFile(prev => ({ ...prev, ...updatedData }));
            setIsEditing(false);
            alert("Job File updated successfully!");
        } catch (error) {
            console.error("Error saving job file:", error);
            alert("Failed to save job file.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!jobFile.id) return;
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

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <Link href="/dashboard/job-files" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Job Files
                </Link>

                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{jobFile.jobTitle}</h1>
                            {client && <p className="text-lg text-primary">{client.companyName || client.name}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                                <Edit size={16}/> Edit
                            </button>
                             <button onClick={handleDelete} className="flex items-center gap-2 bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90">
                                <Trash2 size={16}/> Delete
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Details</h3>
                            {appointment && <p className="text-sm"><span className="font-semibold text-muted-foreground">Linked Appointment:</span> {appointment.subject}</p>}
                            <p className="text-sm"><span className="font-semibold text-muted-foreground">Start Date:</span> {jobFile.startDate || 'Not set'}</p>
                            <p className="text-sm"><span className="font-semibold text-muted-foreground">End Date:</span> {jobFile.endDate || 'Not set'}</p>
                            {jobFile.fileUrl && (
                                <a href={jobFile.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                    <Download size={16}/> Download Attached File
                                </a>
                            )}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Shared Notes</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded-md min-h-[100px]">
                                {jobFile.sharedNotes || 'No shared notes.'}
                            </p>
                            <h3 className="font-semibold text-lg">Private Notes</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded-md min-h-[100px]">
                                {jobFile.privateNotes || 'No private notes.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <div className="p-6">
                    <JobFileForm
                        initialData={jobFile}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        clients={initialClients}
                        appointments={initialAppointments}
                        isSubmitting={isSubmitting}
                        userId={userId} 
                    />
                </div>
            </Modal>
        </>
    );
}