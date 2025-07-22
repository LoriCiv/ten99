"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import {
    updateClient,
    deleteClient,
    updatePersonalNetworkContact,
    deletePersonalNetworkContact,
    convertClientToContact,
    convertContactToClient
} from '@/utils/firestoreService';
// ✅ Import DropdownMenu components and a new icon
import { X, Edit, Trash2, Mail, FileText, Repeat, ClipboardCopy, Check, MoreHorizontal } from 'lucide-react';
import ClientForm from './ClientForm';
import ContactForm from './ContactForm';
// ✅ Import our UI components for the dropdown
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <p><span className="font-semibold text-muted-foreground">{label}:</span> {value || 'N/A'}</p>
);

interface ClientDetailModalProps {
    item: Client | PersonalNetworkContact | null;
    itemType: 'Company' | 'Contact';
    userId: string;
    clients: Client[];
    jobFiles: JobFile[];
    onClose: () => void;
    onSave: () => void;
}

export default function ClientDetailModal({ item, itemType, userId, clients, jobFiles, onClose, onSave }: ClientDetailModalProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsEditing(false);
        setIsCopied(false);
    }, [item]);
    
    const relevantJobFiles = useMemo(() => {
        if (!item || itemType !== 'Company' || !item.id) return [];
        return jobFiles.filter(jf => jf.clientId === item.id);
    }, [jobFiles, item, itemType]);

    if (!item) {
        return null;
    }
    
    // ✅ All handler functions are fully expanded here
    const handleSave = async (formData: Partial<Client | PersonalNetworkContact>) => {
        if (!item.id) return;
        setIsSubmitting(true);
        try {
            if (itemType === 'Company') {
                await updateClient(userId, item.id, formData as Partial<Client>);
            } else {
                await updatePersonalNetworkContact(userId, item.id, formData as Partial<PersonalNetworkContact>);
            }
            alert(`${itemType} updated successfully!`);
            onSave();
            setIsEditing(false);
        } catch (error) {
            console.error(`Error saving ${itemType}:`, error);
        } finally {
            setIsSubmitting(false);
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
                onSave();
                onClose();
            } catch (err) {
                console.error("Failed to delete item:", err);
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
                if (itemType === 'Company') {
                    await convertClientToContact(userId, item as Client);
                } else {
                    await convertContactToClient(userId, item as PersonalNetworkContact);
                }
                alert('Conversion successful!');
                onSave();
                onClose();
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

    const handleCopyInfo = () => {
        const name = (item as Client).companyName || item.name;
        const email = item.email || 'N/A';
        const phone = item.phone || 'N/A';
        const textToCopy = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(() => {
            alert("Failed to copy information.");
        });
    };
    
    const handleDuplicate = () => {
        if (itemType !== 'Company') return;
        const { id, createdAt, ...duplicateData } = item as Client;
        const dataString = encodeURIComponent(JSON.stringify(duplicateData));
        router.push(`/dashboard/clients/new-company?data=${dataString}`);
    };


    const emailToUse = item.email || (itemType === 'Company' ? (item as Client).billingEmail : '');
    const jobFileLink = relevantJobFiles.length === 1 && relevantJobFiles[0].id
        ? `/dashboard/job-files/${relevantJobFiles[0].id}`
        : `/dashboard/job-files?clientId=${item.id}`;


    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h2 className="text-2xl font-bold">{isEditing ? `Edit ${itemType}` : `${itemType} Details`}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full"><X size={24}/></button>
                    </div>

                    {isEditing ? (
                       itemType === 'Company' ? (
                            <ClientForm initialData={item as Client} onSave={handleSave} onCancel={() => setIsEditing(false)} isSubmitting={isSubmitting} onDuplicate={handleDuplicate} />
                        ) : (
                            <ContactForm initialData={item as PersonalNetworkContact} onSave={handleSave} onCancel={() => setIsEditing(false)} isSubmitting={isSubmitting} clients={clients} />
                        )
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl">{(item as Client).companyName || item.name}</h3>
                            <DetailItem label="Email" value={item.email} />
                            <DetailItem label="Phone" value={item.phone} />
                            {itemType === 'Company' && <DetailItem label="Primary Contact" value={(item as Client).name} />}
                            
                            <div className="flex justify-end items-center gap-2 pt-4 border-t">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={handleCopyInfo} className="cursor-pointer">
                                            <ClipboardCopy className="mr-2 h-4 w-4" />
                                            <span>{isCopied ? 'Copied!' : 'Copy Info'}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer">
                                            {emailToUse ? <Link href={`/dashboard/mailbox?to=${emailToUse}`} className="flex items-center w-full"><Mail className="mr-2 h-4 w-4" />Send Message</Link> : <span className="opacity-50 flex items-center w-full"><Mail className="mr-2 h-4 w-4" />Send Message</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer">
                                            {relevantJobFiles.length > 0 ? <Link href={jobFileLink} className="flex items-center w-full"><FileText className="mr-2 h-4 w-4" />View Files ({relevantJobFiles.length})</Link> : <span className="opacity-50 flex items-center w-full"><FileText className="mr-2 h-4 w-4" />View Files</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={handleConvert} disabled={isConverting} className="cursor-pointer">
                                            <Repeat className="mr-2 h-4 w-4" />
                                            <span>{isConverting ? 'Converting...' : 'Convert'}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
                                    <Trash2 size={16}/>Delete
                                </Button>
                                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                                    <Edit size={16}/>Edit
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}