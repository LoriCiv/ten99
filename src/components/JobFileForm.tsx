// src/components/JobFileForm.tsx

"use client";

import { useState, useEffect } from 'react';
import type { JobFile, Client, Appointment } from '@/types/app-interfaces';
import { Save, Loader2, UploadCloud, File, Trash2 } from 'lucide-react';

interface JobFileFormProps {
    onSave: (data: Partial<JobFile>, fileToUpload: File | null) => Promise<void>;
    onCancel: () => void;
    clients: Client[];
    appointments: Appointment[];
    initialData?: Partial<JobFile>;
    isSubmitting: boolean;
    userId: string; 
    statusMessage: string | null; // ✅ 1. Add the statusMessage prop
}

export default function JobFileForm({ 
    onSave, 
    onCancel, 
    clients, 
    appointments, 
    initialData, 
    isSubmitting, 
    userId, 
    statusMessage // ✅ 2. Receive the statusMessage prop
}: JobFileFormProps) {
    const isEditMode = !!initialData?.id;
    const [formState, setFormState] = useState<Partial<JobFile>>(initialData || {});
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'shared' | 'private'>('shared');

    useEffect(() => {
        setFormState(initialData || {});
        setTags(initialData?.tags || []);
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim() !== '') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.jobTitle) {
            // The parent component will now handle displaying this error
            // alert("Job Title is required.");
            return;
        }
        await onSave({ ...formState, tags }, selectedFile);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{isEditMode ? 'Edit Job File' : 'New Job File'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div><label className="block text-sm font-medium text-muted-foreground">Job Title*</label><input name="jobTitle" value={formState.jobTitle || ''} onChange={handleInputChange} type="text" className="w-full mt-1 p-2 border rounded-md bg-background" required /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Client</label><select name="clientId" value={formState.clientId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background"><option value="">-- Select Client --</option>{clients.map(client => (<option key={client.id} value={client.id!}>{client.companyName || client.name}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Link to First Appointment (Optional)</label><select name="appointmentId" value={formState.appointmentId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background"><option value="">-- Select Appointment --</option>{appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (<option key={appt.id} value={appt.id!}>{appt.date} - {appt.subject}</option>))}</select></div>
                
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Attach File</label>
                    {formState.fileUrl && !selectedFile ? (
                        <div className="mt-2 flex items-center justify-between p-2 border rounded-md bg-background">
                            <a href={formState.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                                <File size={16} />
                                <span className="truncate">{formState.fileUrl.split('%2F').pop()?.split('?')[0] || "View Attached File"}</span>
                            </a>
                            <button type="button" onClick={() => setFormState(prev => ({...prev, fileUrl: ''}))} className="p-1 text-destructive hover:bg-destructive/10 rounded-full">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="mt-1 flex items-center gap-2">
                            <label className="flex-1 cursor-pointer flex items-center gap-2 justify-center px-4 py-2 border rounded-md bg-background hover:bg-muted">
                                <UploadCloud size={16} />
                                <span>{selectedFile ? 'Change file' : 'Choose file'}</span>
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                            {selectedFile && <p className="text-sm text-muted-foreground truncate flex-1">{selectedFile.name}</p>}
                        </div>
                    )}
                </div>
                
                <div><label className="block text-sm font-medium text-muted-foreground">Tags</label><div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background mt-1">{tags.map(tag => (<div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-medium px-2 py-1 rounded-full"><span>{tag}</span><button type="button" onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-foreground">&times;</button></div>))}{<input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder={tags.length === 0 ? "Add tags (press Enter)" : "Add more..."} className="flex-grow bg-transparent outline-none p-1"/>}</div></div>
                
                <div>
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button type="button" onClick={() => setActiveTab('shared')} className={`${activeTab === 'shared' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Shared Notes</button>
                            <button type="button" onClick={() => setActiveTab('private')} className={`${activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Private Notes</button>
                        </nav>
                    </div>
                    <div className="mt-4">
                        {activeTab === 'shared' && (
                            <textarea name="sharedNotes" value={formState.sharedNotes || ''} onChange={handleInputChange} rows={4} className="w-full p-2 border rounded-md bg-background" placeholder="Visible on shared links..."></textarea>
                        )}
                        {activeTab === 'private' && (
                            <textarea name="privateNotes" value={formState.privateNotes || ''} onChange={handleInputChange} rows={4} className="w-full p-2 border rounded-md bg-background" placeholder="For your eyes only..."></textarea>
                        )}
                    </div>
                </div>

                {/* ✅ 3. Add a place to display status messages */}
                {statusMessage && <p className="text-red-500 text-sm text-center">{statusMessage}</p>}

                <div className="flex justify-end items-center mt-4 pt-4 border-t border-border">
                  <div className="flex space-x-3">
                    <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 w-36 justify-center">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSubmitting ? 'Saving...' : 'Save File'}
                    </button>
                  </div>
                </div>
            </form>
        </div>
    );
}