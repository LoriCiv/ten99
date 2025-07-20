// src/components/ClientDetailModal.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
// We don't need the router here anymore for this simple fix
import type { Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { updateClient, deleteClient, updatePersonalNetworkContact, deletePersonalNetworkContact, convertClientToContact, convertContactToClient } from '@/utils/firestoreService';
import { X, Edit, Trash2, Save, FileText, Repeat, Mail } from 'lucide-react';
import ClientForm from './ClientForm';
import ContactForm from './ContactForm';

interface ClientDetailModalProps {
    item: Client | PersonalNetworkContact | null;
    itemType: 'Company' | 'Contact';
    userId: string;
    clients: Client[];
    jobFiles: JobFile[];
    onClose: () => void;
}

export default function ClientDetailModal({ item, itemType, userId, clients, jobFiles, onClose }: ClientDetailModalProps) {
    if (!item) { return null; }
    
    const [isEditing, setIsEditing] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => { setIsEditing(false); }, [item]);
    
    const handleSave = async (formData: Partial<Client | PersonalNetworkContact>) => {
        if (!item.id) return;
        try {
            if (itemType === 'Company') {
                await updateClient(userId, item.id, formData as Partial<Client>);
            } else {
                await updatePersonalNetworkContact(userId, item.id, formData as Partial<PersonalNetworkContact>);
            }
            alert(`${itemType} updated successfully!`);
            window.location.reload(); // Reload the page to show changes
        } catch (error) {
            console.error(`Error saving ${itemType}:`, error);
        }
    };

    const handleDelete = async () => {
        if (!item.id) return;
        const itemName = (item as Client).companyName || item.name;
        if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
            try {
                if (itemType === 'Company') await deleteClient(userId, item.id);
                else await deletePersonalNetworkContact(userId, item.id);
                alert('Item deleted.');
                // ✅ THE FIX: A simple page reload guarantees the list updates.
                window.location.reload();
            } catch (error) {
                alert('Failed to delete item.');
            }
        }
    };
    
    const handleConvert = async () => {
        if (!item.id) return;
        setIsConverting(true);
        const targetType = itemType === 'Company' ? 'Contact' : 'Company';
        if (window.confirm(`Are you sure you want to convert this ${itemType} to a ${targetType}?`)) {
            try {
                if (itemType === 'Company') await convertClientToContact(userId, item as Client);
                else await convertContactToClient(userId, item as PersonalNetworkContact);
                alert('Conversion successful!');
                // ✅ THE FIX: A simple page reload guarantees the list updates.
                window.location.reload();
            } catch (error) {
                console.error("Conversion error:", error);
                alert("An error occurred during conversion.");
            } finally {
                setIsConverting(false);
            }
        } else {
            setIsConverting(false);
        }
     };

    const emailToUse = item.email || (itemType === 'Company' ? (item as Client).billingEmail : '');
    const relevantJobFiles = useMemo(() => {
        if (itemType !== 'Company' || !item.id) return [];
        return jobFiles.filter(jf => jf.clientId === item.id);
    }, [jobFiles, item, itemType]);
    const jobFileLink = relevantJobFiles.length === 1 && relevantJobFiles[0].id ? `/dashboard/job-files/${relevantJobFiles[0].id}` : `/dashboard/job-files?clientId=${item.id}`;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b"><h2 className="text-2xl font-bold">{isEditing ? `Edit ${itemType}` : `${itemType} Details`}</h2><button onClick={onClose} className="p-1 hover:bg-secondary rounded-full"><X size={24}/></button></div>
                    {isEditing ? (
                        itemType === 'Company' ? ( <ClientForm initialData={item as Client} onSave={handleSave} onCancel={() => setIsEditing(false)} isSubmitting={false} /> ) : 
                        ( <ContactForm initialData={item as PersonalNetworkContact} onSave={handleSave} onCancel={() => setIsEditing(false)} isSubmitting={false} clients={clients} /> )
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl">{(item as Client).companyName || item.name}</h3>
                            <p><span className="font-semibold text-muted-foreground">Email:</span> {item.email || 'N/A'}</p>
                            <p><span className="font-semibold text-muted-foreground">Phone:</span> {item.phone || 'N/A'}</p>
                            {itemType === 'Company' && <p><span className="font-semibold text-muted-foreground">Primary Contact:</span> {(item as Client).name || 'N/A'}</p>}
                            <div className="flex justify-end gap-2 pt-4 border-t flex-wrap">
                                {emailToUse && <Link href={`/dashboard/mailbox?to=${emailToUse}`} className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700"><Mail size={16}/>Send Message</Link>}
                                {relevantJobFiles.length > 0 && <Link href={jobFileLink} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80"><FileText size={16}/>View Files ({relevantJobFiles.length})</Link>}
                                <button onClick={handleConvert} disabled={isConverting} className="flex items-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"><Repeat size={16}/>{isConverting ? 'Converting...' : 'Convert'}</button>
                                <button onClick={handleDelete} className="flex items-center gap-2 bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-rose-700"><Trash2 size={16}/>Delete</button>
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"><Edit size={16}/>Edit</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}