// src/components/AppointmentForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { Info } from 'lucide-react';

interface AppointmentFormProps {
    onCancel: () => void;
    onSave: (data: Partial<Appointment>, recurrenceEndDate?: string) => Promise<void>;
    clients: Client[];
    contacts: PersonalNetworkContact[];
    jobFiles: JobFile[];
    initialData?: Partial<Appointment>;
    isSubmitting: boolean;
}

export default function AppointmentForm({
    onCancel,
    onSave,
    clients = [],
    contacts = [],
    jobFiles = [],
    initialData,
    isSubmitting
}: AppointmentFormProps) {
    const isEditMode = !!initialData?.id;
    const [formState, setFormState] = useState<Partial<Appointment>>({
        eventType: 'job',
        ...initialData
    });
    const [locationType, setLocationType] = useState<'physical' | 'virtual' | ''>(initialData?.locationType || '');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const startingData = { eventType: 'job' as const, status: 'scheduled' as const, ...initialData };
        setFormState(startingData);
        setLocationType(startingData.locationType || '');
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'eventType') {
            setFormState(prev => ({ ...prev, eventType: value as 'job' | 'personal' | 'billing' | 'education' }));
        } else if (name === 'status') {
            setFormState(prev => ({ ...prev, status: value as 'pending' | 'scheduled' | 'completed' | 'canceled' | 'canceled-billable' }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!formState.subject || !formState.date || !formState.time) {
            setErrorMessage("Subject, Date, and Time are required fields.");
            return;
        }
        if (formState.recurrence && !isEditMode && !recurrenceEndDate) {
            setErrorMessage("Please select an end date for the recurring event.");
            return;
        }
        
        const dataToSave = {
            ...formState,
            locationType: locationType,
        };

        await onSave(dataToSave, formState.recurrence ? recurrenceEndDate : undefined);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{isEditMode ? 'Edit Event' : 'New Calendar Event'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground">Event Type</label>
                    <select name="eventType" value={formState.eventType || 'job'} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                        <option value="job">Job / Appointment</option>
                        <option value="personal">Personal Event</option>
                        <option value="billing">Billing Reminder</option>
                        <option value="education">Education / Training</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground">Subject*</label>
                    <input name="subject" value={formState.subject || ''} onChange={handleInputChange} type="text" placeholder={formState.eventType === 'personal' ? "e.g., Dentist Appointment" : "e.g., On-site at Apple HQ"} className="w-full mt-1 p-2 border rounded-md bg-background" required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Status</label>
                    <select name="status" value={formState.status || 'scheduled'} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="canceled">Canceled</option>
                        <option value="canceled-billable">Canceled (Billable)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Date*</label>
                    <input name="date" value={formState.date || ''} onChange={handleInputChange} type="date" className="w-full mt-1 p-2 border rounded-md bg-background" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Start Time*</label>
                        <input name="time" value={formState.time || ''} onChange={handleInputChange} type="time" className="w-full mt-1 p-2 border rounded-md bg-background" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">End Time</label>
                        <input name="endTime" value={formState.endTime || ''} onChange={handleInputChange} type="time" className="w-full mt-1 p-2 border rounded-md bg-background" />
                    </div>
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Recurrence</label>
                        <select name="recurrence" value={formState.recurrence || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background" disabled={isEditMode}>
                            <option value="">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        {isEditMode && <p className="text-xs text-muted-foreground mt-1">Editing recurrence for an existing series is not supported.</p>}
                    </div>
                    {formState.recurrence && !isEditMode && (
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground">Repeat Until Date*</label>
                            <input type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-background" />
                        </div>
                    )}
                </div>

                {(formState.eventType === 'job' || formState.eventType === 'personal' || formState.eventType === 'education') && (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground">Location Type</label>
                            <select name="locationType" value={locationType} onChange={(e) => setLocationType(e.target.value as 'physical' | 'virtual' | '')} className="w-full mt-1 p-2 border rounded-md bg-background">
                                <option value="">Not Specified</option>
                                <option value="physical">Physical Address</option>
                                <option value="virtual">Virtual Meeting</option>
                            </select>
                        </div>
                        {locationType === 'physical' && (<div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground">Physical Address</label><input name="address" value={formState.address || ''} onChange={handleInputChange} type="text" placeholder="123 Main St, Anytown, USA" className="w-full mt-1 p-2 border rounded-md bg-background" /></div>)}
                        {locationType === 'virtual' && (<div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground">Virtual Meeting Link</label><input name="virtualLink" value={formState.virtualLink || ''} onChange={handleInputChange} type="url" placeholder="https://zoom.us/j/..." className="w-full mt-1 p-2 border rounded-md bg-background" /></div>)}
                    </>
                )}
                
                {formState.eventType === 'job' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground">Billing Client</label>
                            <select name="clientId" value={formState.clientId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                                <option value="">-- Select Client --</option>
                                {clients.map(client => (<option key={client.id} value={client.id}>{client.companyName || client.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground">Contact</label>
                            <select name="contactId" value={formState.contactId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                                <option value="">-- Select Contact --</option>
                                {contacts.map(contact => (<option key={contact.id} value={contact.id}>{contact.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground">Link to Job File</label>
                            <select name="jobFileId" value={formState.jobFileId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                                <option value="">-- No Linked File --</option>
                                {jobFiles.map(file => (<option key={file.id} value={file.id}>{file.jobTitle}</option>))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground">Job Number</label>
                            <input name="jobNumber" value={formState.jobNumber || ''} onChange={handleInputChange} type="text" placeholder="e.g., #12345" className="w-full mt-1 p-2 border rounded-md bg-background" />
                        </div>
                    </>
                )}
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground">Notes</label>
                    <textarea name="notes" value={formState.notes || ''} onChange={handleInputChange} placeholder="Add any specific details..." rows={4} className="w-full mt-1 p-2 border rounded-md bg-background"></textarea>
                </div>
                
                {errorMessage && (
                    <div className="md:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                        <Info size={16} />
                        <span className="text-sm">{errorMessage}</span>
                    </div>
                )}

                <div className="md:col-span-2 flex justify-end items-center mt-4 pt-4 border-t border-border">
                    <div className="flex space-x-3">
                        <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Event' : 'Save Event')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}