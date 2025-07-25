// src/components/ShareModal.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { JobFile, Client, PersonalNetworkContact } from '@/types/app-interfaces';
import { createPublicJobFile, sendAppMessage } from '@/utils/firestoreService';
import { X, Copy, Check, Send, Loader2, CheckCircle, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";


interface ShareModalProps {
    onClose: () => void;
    jobFile: JobFile;
    clientName: string;
    // ✅ THE FIX: Removed unused 'dateRange' prop
    currentUserId: string;
    currentUserName: string;
    clients: Client[];
    contacts: PersonalNetworkContact[];
}

export default function ShareModal({
    onClose,
    jobFile,
    clientName,
    currentUserId,
    currentUserName,
    clients,
    contacts,
}: ShareModalProps) {
    const [publicLink, setPublicLink] = useState('');
    const [isLoadingLink, setIsLoadingLink] = useState(true);
    const [copied, setCopied] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const contactList = useMemo(() => {
        const allContacts = new Map<string, { value: string; label: string }>();
        clients.forEach(c => {
            if (c.email) allContacts.set(c.email, { value: c.email, label: `${c.companyName || c.name} <${c.email}>` });
            if (c.billingEmail) allContacts.set(c.billingEmail, { value: c.billingEmail, label: `${c.companyName || c.name} <${c.billingEmail}>` });
        });
        contacts.forEach(c => {
            if (c.email) allContacts.set(c.email, { value: c.email, label: `${c.name} <${c.email}>` });
        });
        return Array.from(allContacts.values()).sort((a,b) => a.label.localeCompare(b.label));
    }, [clients, contacts]);

    useEffect(() => {
        const generateLink = async () => {
            setIsLoadingLink(true);
            try {
                const publicId = await createPublicJobFile(currentUserId, jobFile);
                const link = `${window.location.origin}/share/job/${publicId}`;
                setPublicLink(link);
            } catch (error) {
                console.error("Error creating share link:", error);
            } finally {
                setIsLoadingLink(false);
            }
        };
        generateLink();
    }, [currentUserId, jobFile]);

    const handleCopy = () => {
        if (!publicLink) return;
        navigator.clipboard.writeText(publicLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSendToUser = async () => {
        if (!recipientEmail) return;
        setIsSending(true);
        try {
            const subject = `Job File Shared: ${jobFile.jobTitle}`;
            const body = `${currentUserName} has shared a job file with you.\n\nTitle: ${jobFile.jobTitle}\nClient: ${clientName}\n\nYou can view the details here: ${publicLink}`;
            await sendAppMessage(currentUserId, currentUserName, recipientEmail, subject, body);
            alert(`Job file sent to ${recipientEmail}!`);
            setRecipientEmail('');
        } catch (error) {
            console.error("Failed to send job file:", error);
            alert("Failed to send job file.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg border">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-bold text-foreground">Share Job File</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {isLoadingLink ? (
                        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">Generating secure link...</p></div>
                    ) : publicLink ? (
                        <>
                            <div className="p-3 bg-background rounded-lg space-y-3">
                                <p className="text-sm text-muted-foreground">Your secure, public link is ready:</p>
                                <p className="text-green-500 text-sm break-all font-mono">{publicLink}</p>
                                <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied to Clipboard!' : 'Copy Link'}
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Send directly to a contact:</label>
                                <div className="flex gap-2 mt-1">
                                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                                                {recipientEmail ? contactList.find(c => c.value === recipientEmail)?.label : "Select a contact..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[440px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search contacts..." />
                                                <CommandList>
                                                    <CommandEmpty>No contact found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {contactList.map((contact) => (
                                                            <CommandItem key={contact.value} value={contact.label} onSelect={() => {
                                                                setRecipientEmail(contact.value === recipientEmail ? "" : contact.value);
                                                                setPopoverOpen(false);
                                                            }}>
                                                                <CheckCircle className={`mr-2 h-4 w-4 ${recipientEmail === contact.value ? "opacity-100" : "opacity-0"}`} />
                                                                {contact.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <button onClick={handleSendToUser} disabled={isSending || !recipientEmail} className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                                        <Send size={16} />
                                        {isSending ? '...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}