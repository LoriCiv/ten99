// src/components/ClientDetailModal.tsx
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
} from '@/utils/firestoreService';
import { X, Edit, Trash2, Mail, FileText, Repeat, ClipboardCopy, MoreHorizontal, ThumbsUp, Info } from 'lucide-react';
import ClientForm from './ClientForm'; // We will use this for both companies and contacts
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Modal from './Modal';

// This is a small helper component for displaying details cleanly
const DetailItem = ({ label, value, isLink }: { label: string, value?: string | null, isLink?: boolean }) => {
    if (!value) return null;
    return (
        <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="font-semibold text-muted-foreground col-span-1">{label}</span>
            {isLink ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="col-span-2 text-primary hover:underline truncate">{value}</a>
            ) : (
                <span className="col-span-2 text-foreground capitalize">{value.replace(/_/g, ' ')}</span>
            )}
        </div>
    );
};

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
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        setIsEditing(false);
        setIsCopied(false);
        setStatusMessage(null);
    }, [item]);
    
    const relevantJobFiles = useMemo(() => {
        if (!item || itemType !== 'Company' || !item.id) return [];
        return jobFiles.filter(jf => jf.clientId === item.id);
    }, [jobFiles, item, itemType]);
    
    const handleSave = async (formData: Partial<Client>) => {
        if (!item?.id) return;
        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            if (itemType === 'Company') {
                await updateClient(userId, item.id, formData);
            } else {
                // When saving a 'Contact', we use the updatePersonalNetworkContact function
                // but the form data comes from our unified ClientForm
                await updatePersonalNetworkContact(userId, item.id, formData as Partial<PersonalNetworkContact>);
            }
            onSave();
            setIsEditing(false);
        } catch (error) {
            console.error(`Error saving ${itemType}:`, error);
            setStatusMessage(`Failed to save ${itemType}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!item?.id) return;
        const itemName = (item as Client).companyName || item.name;
        if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
            try {
                if (itemType === 'Company') await deleteClient(userId, item.id);
                else await deletePersonalNetworkContact(userId, item.id);
                onSave();
                onClose();
            } catch (err) {
                console.error("Failed to delete item:", err);
                alert('Failed to delete item.');
            }
        }
    };
    
    const handleConvert = async () => {
        alert("This feature is temporarily disabled.");
    };

    const handleCopyInfo = () => {
        if (!item) return;
        const name = (item as Client).companyName || item.name;
        const email = item.email || 'N/A';
        const phone = item.phone || 'N/A';
        const textToCopy = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`;
        
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            alert("Failed to copy information.");
        }
        document.body.removeChild(textArea);
    };
    
    const handleDuplicate = () => {
        if (itemType !== 'Company' || !item) return;
        const duplicateData = { ...(item as Client) };
        delete duplicateData.id;
        delete duplicateData.createdAt;
        const dataString = encodeURIComponent(JSON.stringify(duplicateData));
        router.push(`/dashboard/clients/new-company?data=${dataString}`);
    };

    const emailToUse = item?.email || (itemType === 'Company' ? (item as Client).billingEmail : '');
    const jobFileLink = relevantJobFiles.length === 1 && relevantJobFiles[0].id
        ? `/dashboard/job-files/${relevantJobFiles[0].id}`
        : `/dashboard/job-files?clientId=${item?.id}`;


    return (
        <Modal isOpen={!!item} onClose={onClose}>
            {item && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <h2 className="text-2xl font-bold">{isEditing ? `Edit ${itemType}` : `${itemType} Details`}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full"><X size={24}/></button>
                    </div>

                    {isEditing ? (
                        // ✅ Use the smart ClientForm for both Company and Contact
                        <ClientForm 
                            formType={itemType === 'Company' ? 'company' : 'contact'}
                            initialData={item as Client} 
                            onSave={handleSave} 
                            onCancel={() => setIsEditing(false)} 
                            isSubmitting={isSubmitting} 
                            onDuplicate={itemType === 'Company' ? handleDuplicate : undefined}
                            statusMessage={statusMessage}
                        />
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-2xl text-foreground">{(item as Client).companyName || item.name}</h3>
                                {itemType === 'Company' && <p className="text-sm text-muted-foreground capitalize">{ (item as Client).status} / {(item as Client).clientType?.replace(/_/g, ' ')}</p>}
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary border-b pb-1 mb-2">Contact Information</h4>
                                {itemType === 'Company' && <DetailItem label="Primary Contact" value={(item as Client).name} />}
                                {itemType === 'Company' && <DetailItem label="Contact Title" value={(item as Client).jobTitle} />}
                                <DetailItem label="Email" value={item.email} />
                                {itemType === 'Company' && <DetailItem label="Billing Email" value={(item as Client).billingEmail} />}
                                <DetailItem label="Phone" value={item.phone} />
                                {itemType === 'Company' && <DetailItem label="Address" value={(item as Client).address} />}
                                {itemType === 'Company' && <DetailItem label="Website" value={(item as Client).website} isLink={true} />}
                            </div>
                            
                            {itemType === 'Company' && (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-primary border-b pb-1 mb-2">Payment Details</h4>
                                        <DetailItem label="Standard Rate" value={(item as Client).rate ? `$${Number((item as Client).rate).toFixed(2)}/hr` : 'N/A'} />
                                        <DetailItem label="Payment Frequency" value={(item as Client).payFrequency} />
                                        <DetailItem label="Payment Method" value={(item as Client).paymentMethod} />
                                        <DetailItem label="Bank Statement Name" value={(item as Client).bankPostedName} />
                                    </div>

                                    {(item as Client).differentials && ((item as Client).differentials?.length ?? 0) > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-primary border-b pb-1 mb-2">Rate Differentials</h4>
                                            {(item as Client).differentials?.map(diff => (
                                                <div key={diff.id} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{diff.description}</span>
                                                    <span className="font-semibold text-foreground">${Number(diff.amount).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {item.notes && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-primary border-b pb-1 mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
                                </div>
                            )}
                            
                            <div className="flex justify-end items-center gap-2 pt-6 border-t">
                                {itemType === 'Company' && (
                                    <Button asChild variant="outline">
                                        <Link href={jobFileLink} className="flex items-center gap-2">
                                            <FileText size={16}/>
                                            {relevantJobFiles.length > 0 ? `View Files (${relevantJobFiles.length})` : 'Job Files'}
                                        </Link>
                                    </Button>
                                )}
                                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                                    <Edit size={16}/>Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={handleCopyInfo} className="cursor-pointer"><ClipboardCopy className="mr-2 h-4 w-4" /><span>{isCopied ? 'Copied!' : 'Copy Info'}</span></DropdownMenuItem>
                                        <DropdownMenuItem asChild className="cursor-pointer">{emailToUse ? <Link href={`/dashboard/mailbox?to=${emailToUse}`} className="flex items-center w-full"><Mail className="mr-2 h-4 w-4" />Send Message</Link> : <span className="opacity-50 flex items-center w-full"><Mail className="mr-2 h-4 w-4" />Send Message</span>}</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={handleConvert} disabled={true} className="cursor-pointer"><Repeat className="mr-2 h-4 w-4" /><span>Convert</span></DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={handleDelete} className="cursor-pointer text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}