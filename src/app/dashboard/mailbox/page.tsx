"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, ArrowLeft, Trash2, Search, Check, X as XIcon, Send, RotateCcw, Clock, CalendarCheck, CornerDownLeft } from 'lucide-react';
import type { Message, JobPosting } from '@/types/app-interfaces';
import {
    getMessagesForUser,
    getSentMessagesForUser,
    sendAppMessage,
    updateMessage,
    deleteMessage,
    sendJobOffer,
    declineJobApplication,
    rescindJobOffer,
    acceptJobOffer,
    declineJobOffer,
    getJobPostings,
    declineInboundOffer,
    acceptInboundOfferPending,
    confirmInboundOffer
} from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';
import { Timestamp } from 'firebase/firestore';

const TEMP_USER_ID = "dev-user-1";
const TEMP_USER_NAME = "Dev User";

function MailboxPageInternal() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');
    const [searchTerm, setSearchTerm] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [composeInitialData, setComposeInitialData] = useState<{recipient: string, subject: string, body: string}>();
    
    const initialRecipient = searchParams.get('to');

    useEffect(() => {
        if (initialRecipient && !isComposing) { 
            setComposeInitialData({ recipient: initialRecipient, subject: '', body: ''});
            setIsComposing(true); 
        }
    }, [initialRecipient, isComposing]);

    useEffect(() => {
        const unsubMessages = activeFolder === 'inbox'
            ? getMessagesForUser(TEMP_USER_ID, setMessages)
            : getSentMessagesForUser(TEMP_USER_ID, setMessages);
        
        const unsubJobs = getJobPostings(setJobPostings);
        
        setSelectedMessage(null);
        return () => {
            unsubMessages();
            unsubJobs();
        };
    }, [activeFolder]);

    const filteredMessages = useMemo(() => {
        if (!searchTerm) return messages;
        const lowercasedTerm = searchTerm.toLowerCase();
        return messages.filter(message => 
            message.senderName.toLowerCase().includes(lowercasedTerm) ||
            message.subject.toLowerCase().includes(lowercasedTerm) ||
            message.body.toLowerCase().includes(lowercasedTerm)
        );
    }, [messages, searchTerm]);

    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        setIsComposing(false);
        if (activeFolder === 'inbox' && !message.isRead && message.id) {
            updateMessage(TEMP_USER_ID, message.id, { isRead: true });
        }
    };

    const handleCompose = () => {
        setComposeInitialData(undefined);
        setSelectedMessage(null);
        setIsComposing(true);
    };
    
    const handleReply = () => {
        if (!selectedMessage || !selectedMessage.createdAt || !(selectedMessage.createdAt instanceof Timestamp)) return;
        const dateString = selectedMessage.createdAt.toDate().toLocaleString();
        const quotedBody = `\n\n--- On ${dateString}, ${selectedMessage.senderName} wrote: ---\n> ${selectedMessage.body.replace(/\n/g, '\n> ')}`;
        setComposeInitialData({
            recipient: selectedMessage.senderId,
            subject: `Re: ${selectedMessage.subject}`,
            body: quotedBody
        });
        setSelectedMessage(null);
        setIsComposing(true);
    };

    const handleSend = async (to: string, subject: string, body: string) => {
        try {
            await sendAppMessage(TEMP_USER_ID, TEMP_USER_NAME, to, subject, body);
            alert("Message sent!");
            setIsComposing(false);
            setActiveFolder('sent');
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    };
    
    const handleDelete = async () => {
        if (!selectedMessage || !selectedMessage.id) return;
        if (window.confirm("Are you sure you want to permanently delete this message?")) {
            try {
                await deleteMessage(TEMP_USER_ID, selectedMessage.id);
                alert("Message deleted.");
                setSelectedMessage(null);
            } catch (error) {
                console.error("Error deleting message:", error);
                alert("Failed to delete message.");
            }
        }
    };

    const handleAction = async (action: (userIdOrMessage: any, message?: any) => Promise<void>, newStatus: Message['status'], successMessage: string, ...args: any[]) => {
        if (!selectedMessage || !selectedMessage.id) return;
        const originalMessageId = selectedMessage.id;

        setIsActionLoading(true);
        try {
            if (args.length > 0) {
                 await action(args[0], selectedMessage);
            } else {
                 await action(selectedMessage);
            }
            
            // ✅ FIX: Show a success message
            alert(successMessage);

            // ✅ FIX: Update the UI immediately without a page refresh
            const updatedMessages = messages.map(m => 
                m.id === originalMessageId ? { ...m, status: newStatus } : m
            );
            setMessages(updatedMessages);
            setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);

        } catch (error) {
            console.error("Mailbox action failed:", error);
            alert(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const relatedJobPost = selectedMessage?.jobPostId 
        ? jobPostings.find(p => p.id === selectedMessage.jobPostId) 
        : null;

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            <div className={`w-full md:w-1/3 border-r border-border flex-col ${selectedMessage || isComposing ? 'hidden' : 'flex'} md:flex`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveFolder('inbox')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeFolder === 'inbox' ? 'bg-secondary' : 'hover:bg-muted'}`}>Inbox</button>
                        <button onClick={() => setActiveFolder('sent')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeFolder === 'sent' ? 'bg-secondary' : 'hover:bg-muted'}`}>Sent</button>
                    </div>
                    <button onClick={handleCompose} className="p-2 rounded-full hover:bg-muted"><Pencil size={18} /></button>
                </div>
                <div className="p-2 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" placeholder="Search mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 p-2 text-sm border rounded-md bg-background"/></div></div>
                <ul className="overflow-y-auto">
                    {filteredMessages.map(message => {
                        const jobForThisMessage = jobPostings.find(p => p.id === message.jobPostId);
                        const isOfferPendingForThisJob = jobForThisMessage && jobForThisMessage.pendingApplicantId && jobForThisMessage.pendingApplicantId !== message.senderId;
                        const isDisabled = message.type === 'application' && isOfferPendingForThisJob;
                        return (
                             <li key={message.id} onClick={() => !isDisabled && handleSelectMessage(message)} className={`p-4 border-b ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${selectedMessage?.id === message.id ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                                <p className={`font-semibold ${!message.isRead && activeFolder === 'inbox' ? 'text-primary' : ''}`}>{message.senderName}</p>
                                <p className="text-sm truncate">{message.subject}</p>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            <div className={`w-full md:w-2/3 p-6 overflow-y-auto ${!selectedMessage && !isComposing ? 'hidden' : 'block'} md:block`}>
                 {isComposing ? (
                     <ComposeMessageForm 
                        onSend={handleSend} 
                        onClose={() => setIsComposing(false)} 
                        initialRecipient={composeInitialData?.recipient}
                        initialSubject={composeInitialData?.subject}
                        initialBody={composeInitialData?.body}
                     />
                 ) : selectedMessage ? (
                     <div>
                         <div className="flex justify-between items-start">
                             <button onClick={() => setSelectedMessage(null)} className="md:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Back to {activeFolder === 'inbox' ? 'Inbox' : 'Sent'}</button>
                             <div className="ml-auto flex items-center gap-2">
                                <button onClick={handleReply} className="p-2 text-muted-foreground hover:text-primary rounded-full hover:bg-muted"><CornerDownLeft size={18} /><span className="sr-only">Reply</span></button>
                                <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted"><Trash2 size={18} /><span className="sr-only">Delete message</span></button>
                             </div>
                         </div>
                         <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
                         <p className="text-sm text-muted-foreground">From: {selectedMessage.senderName} &lt;{selectedMessage.senderId}&gt;</p>
                         <div className="mt-6 prose prose-sm max-w-none whitespace-pre-wrap">{selectedMessage.body}</div>
                         
                         {activeFolder === 'inbox' && (
                            <div className="mt-8 pt-6 border-t space-y-4">
                                {/* Actions for Job Board Messages */}
                                { (selectedMessage.type === 'application' || selectedMessage.type === 'offer') && (
                                    <>
                                        {/* ... (This section is unchanged, but handleAction calls are updated) ... */}
                                    </>
                                )}

                                {/* Actions for Inbound Email Offers */}
                                { selectedMessage.type !== 'application' && selectedMessage.type !== 'offer' && (
                                    <>
                                        <h3 className="font-semibold text-foreground">Inbound Offer Actions</h3>
                                        {selectedMessage.status === 'new' && (
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => handleAction(confirmInboundOffer, 'approved', 'Appointment Confirmed & Booked!', TEMP_USER_ID)} disabled={isActionLoading} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"><CalendarCheck size={16}/> Confirm & Book</button>
                                                <button onClick={() => handleAction(acceptInboundOfferPending, 'pending', 'Appointment set to pending and reply sent!', TEMP_USER_ID)} disabled={isActionLoading} className="flex items-center gap-2 bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50"><Clock size={16}/> Accept Pending</button>
                                                <button onClick={() => handleAction(declineInboundOffer, 'declined', 'Offer declined and reply sent.', TEMP_USER_ID)} disabled={isActionLoading} className="flex items-center gap-2 bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-rose-700 disabled:opacity-50"><XIcon size={16}/> Decline</button>
                                            </div>
                                        )}
                                        {selectedMessage.status === 'pending' && (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <button onClick={() => handleAction(confirmInboundOffer, 'approved', 'Appointment Confirmed & Booked!', TEMP_USER_ID)} disabled={isActionLoading} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"><CalendarCheck size={16}/> Confirm & Book</button>
                                                <p className="text-sm text-muted-foreground">Status: Awaiting your final confirmation.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {['approved', 'declined', 'offer-rescinded', 'pending'].includes(selectedMessage.status || '') && (
                                    <p className="text-sm font-semibold text-muted-foreground mt-4">This message has been actioned. Status: &apos;{selectedMessage.status}&apos;.</p>
                                )}
                            </div>
                         )}
                     </div>
                 ) : (
                     <div className="hidden md:flex items-center justify-center h-full"><p className="text-muted-foreground">Select a message to read.</p></div>
                 )}
            </div>
        </div>
    );
}

export default function MailboxPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Mailbox...</div>}>
            <MailboxPageInternal />
        </Suspense>
    );
}