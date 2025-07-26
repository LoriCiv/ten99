"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { updateAppointment, deleteAppointment, createInvoiceFromAppointment } from '@/utils/firestoreService';
import { X, Edit, Trash2, Building, User, Calendar, FileText, Receipt } from 'lucide-react';
import AppointmentForm from './AppointmentForm';
import Modal from './Modal'; // Import our new Modal component

const TEMP_USER_ID = "dev-user-1";

const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

interface AppointmentDetailModalProps {
    appointment: Appointment | null;
    clients: Client[];
    contacts: PersonalNetworkContact[];
    jobFiles: JobFile[];
    onClose: () => void;
    onSave: () => void;
}

export default function AppointmentDetailModal({ appointment, clients, contacts, jobFiles, onClose, onSave }: AppointmentDetailModalProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { setIsEditing(false); }, [appointment]);

    const client = appointment ? clients.find(c => c.id === appointment.clientId) : null;
    const contact = appointment ? contacts.find(c => c.id === appointment.contactId) : null;
    const jobFile = appointment ? jobFiles.find(jf => jf.id === appointment.jobFileId) : null;

    const handleDelete = async () => {
        if (!appointment?.id) return;
        if (window.confirm("Are you sure you want to delete this appointment?")) {
            try {
                await deleteAppointment(TEMP_USER_ID, appointment.id);
                alert("Appointment deleted.");
                onSave();
                onClose();
            } catch (error) {
                console.error("Error deleting appointment:", error);
                alert("Failed to delete appointment.");
            }
        }
    };

    const handleEditSave = async (updatedData: Partial<Appointment>) => {
        if (!appointment?.id) return;
        setIsSubmitting(true);
        try {
            await updateAppointment(TEMP_USER_ID, appointment.id, updatedData);
            
            if (updatedData.status === 'canceled-billable') {
                const fullAppointmentData = { ...appointment, ...updatedData };
                await createInvoiceFromAppointment(TEMP_USER_ID, fullAppointmentData as Appointment);
                alert("Appointment canceled and a draft invoice has been automatically created.");
            } else {
                alert("Appointment updated!");
            }
            
            onSave();
            onClose();
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert("Failed to update appointment.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleJobFileClick = () => {
        if (jobFile?.id) { router.push(`/dashboard/job-files/${jobFile.id}`); }
        else if (appointment?.id) { router.push(`/dashboard/job-files/new?appointmentId=${appointment.id}&clientId=${appointment.clientId || ''}&subject=${encodeURIComponent(appointment.subject || '')}`); }
        onClose();
    };

    const handleCreateInvoiceClick = () => {
        if (appointment?.id) {
            router.push(`/dashboard/invoices/new?appointmentId=${appointment.id}`);
            onClose();
        }
    };

    return (
        <Modal isOpen={!!appointment} onClose={onClose}>
            {appointment && (
                isEditing ? (
                    <AppointmentForm
                        initialData={appointment}
                        clients={clients}
                        contacts={contacts}
                        jobFiles={jobFiles}
                        onSave={handleEditSave}
                        onCancel={() => setIsEditing(false)}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <>
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold">{appointment.subject}</h2>
                                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
                            </div>
                            <div className="flex items-center text-sm mt-2 text-muted-foreground">
                                <Calendar size={14} className="mr-2"/>
                                <span>
                                    {new Date(appointment.date + 'T00:00:00').toDateString()}
                                    {appointment.endTime
                                        ? ` from ${formatTime(appointment.time)} to ${formatTime(appointment.endTime)}`
                                        : ` at ${formatTime(appointment.time)}`
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="px-6 pb-6 space-y-4 border-t pt-4">
                            {client && <div className="flex items-center text-sm"><Building size={16} className="mr-3 text-primary"/>Linked Client: <span className="font-semibold ml-2">{client.companyName || client.name}</span></div>}
                            {contact && <div className="flex items-center text-sm"><User size={16} className="mr-3 text-primary"/>Linked Contact: <span className="font-semibold ml-2">{contact.name}</span></div>}
                            {jobFile && <div className="flex items-center text-sm"><FileText size={16} className="mr-3 text-primary"/>Linked Job File: <span className="font-semibold ml-2">{jobFile.jobTitle}</span></div>}
                        </div>
                        <div className="px-6 pb-6">
                            <h4 className="font-semibold mb-2">Notes</h4>
                            <div className="text-sm p-3 bg-background rounded-md min-h-[80px] whitespace-pre-wrap">
                                {appointment.notes || <span className="text-muted-foreground">No notes for this appointment.</span>}
                            </div>
                        </div>
                        <div className="p-6 flex justify-end gap-2 bg-muted/50 border-t flex-wrap">
                           {(appointment.status === 'completed' || appointment.status === 'canceled-billable') ? (
                                <button onClick={handleCreateInvoiceClick} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">
                                    <Receipt size={16}/> Create Invoice
                                </button>
                           ) : (
                                <button onClick={handleJobFileClick} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                                    <FileText size={16}/> {jobFile ? 'View Job File' : 'Create Job File'}
                                </button>
                           )}
                            <button onClick={handleDelete} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Trash2 size={16}/>Delete</button>
                            <button onClick={() => setIsEditing(true)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Edit size={16}/>Edit</button>
                        </div>
                    </>
                )
            )}
        </Modal>
    );
}