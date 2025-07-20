// src/app/dashboard/mailbox/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Send, Inbox, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { Message, Template } from '@/types/app-interfaces';
import { 
    getMessagesForUser, 
    getSentMessagesForUser, 
    sendAppMessage, 
    updateMessage, 
    getTemplates,
    approveMessageAndCreateAppointment 
} from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';

const TEMP_USER_ID = "dev-user-1";
const TEMP_USER_NAME = "Dev User"; 

function MailboxPageInternal() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');
    const [composeInitialData, setComposeInitialData] = useState<{ recipient: string, subject: string, body: string }>({ recipient: '', subject: '', body: '' });
    const [isActionLoading, setIsActionLoading] = useState(false); // Combined loading state for all actions
    
    const initialRecipient = searchParams.get('to');

    useEffect(() => {
        if (initialRecipient) {
            setComposeInitialData({ recipient: initialRecipient, subject: '', body: '' });
            setIsComposing(true);
        }
    }, [initialRecipient]);

    useEffect(() => {
        setIsLoading(true);
        const unsubMessages = activeFolder === 'inbox'
            ? getMessagesForUser(TEMP_USER_ID, (data) => { setMessages(data); setIsLoading(false); })
            : getSentMessagesForUser(TEMP_USER_ID, (data) => { setMessages(data); setIsLoading(false); });
        
        const unsubTemplates = getTemplates(TEMP_USER_ID, setTemplates);
        
        setSelectedMessage(null);
        return () => {
            unsubMessages();
            unsubTemplates();
        };
    }, [activeFolder]);

    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        setIsComposing(false);
        if (activeFolder === 'inbox' && !message.isRead && message.id) {
            updateMessage(TEMP_USER_ID, message.id, { isRead: true });
        }
    };

    const handleCompose = () => {
        setSelectedMessage(null);
        setComposeInitialData({ recipient: '', subject: '', body: '' });
        setIsComposing(true);
    };

    const handleSend = async (to: string, subject: string, body: string) => {
        try {
            await sendAppMessage(TEMP_USER_ID, TEMP_USER_NAME, to, subject, body);
            alert("Message sent!");
            setIsComposing(false);
            setActiveFolder('sent');
            // If this was a reply to an existing message, update its status
            if (selectedMessage && selectedMessage.id && selectedMessage.status !== 'approved') {
                await updateMessage(TEMP_USER_ID, selectedMessage.id, { status: 'pending' });
            }
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    };

    const handleApprove = async (message: Message) => {
        if (!message.id) return;
        const confirmation = window.confirm("Are you sure? This will create an appointment on your calendar.");
        if (!confirmation) return;

        setIsActionLoading(true);
        try {
            await approveMessageAndCreateAppointment(TEMP_USER_ID, message);
            alert("Success! The appointment has been added to your calendar.");
        } catch (error) {
            console.error("Error approving message:", error);
            alert(`Failed to approve: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    // ✅ --- NEW: Automated Decline Logic ---
    const handleDecline = async (message: Message) => {
        if (!message.id) return;
        const declineTemplate = templates.find(t => t.type === 'decline');
        if (!declineTemplate) {
            alert("No 'Decline' template found. Please create one in Settings.");
            return;
        }

        const confirmation = window.confirm("Are you sure you want to decline? This will send a pre-written reply.");
        if (!confirmation) return;

        setIsActionLoading(true);
        try {
            const subject = `Re: ${message.subject}`;
            const body = declineTemplate.body;
            await sendAppMessage(TEMP_USER_ID, TEMP_USER_NAME, message.senderId, subject, body);
            await updateMessage(TEMP_USER_ID, message.id, { status: 'declined' });
            alert("Decline message sent.");
        } catch (error) {
            alert("Failed to send decline message.");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ✅ --- NEW: Automated Pending Logic ---
    const handlePending = async (message: Message) => {
        if (!message.id) return;
        const pendingTemplate = templates.find(t => t.type === 'pending');
        if (!pendingTemplate) {
            alert("No 'Pending' template found. Please create one in Settings.");
            return;
        }
        
        setIsActionLoading(true);
        try {
            const subject = `Re: ${message.subject}`;
            const body = pendingTemplate.body;
            await sendAppMessage(TEMP_USER_ID, TEMP_USER_NAME, message.senderId, subject, body);
            await updateMessage(TEMP_USER_ID, message.id, { status: 'pending' });
            alert("Pending reply sent.");
        } catch(error) {
             alert("Failed to send pending message.");
        } finally {
            setIsActionLoading(false);
        }
    };


    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 flex justify-between items-center border-b border-border">
                    <h1 className="text-xl font-bold">Mailbox</h1>
                    <button onClick={handleCompose} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Pencil size={16} /></button>
                </div>
                <div className="p-2 border-b border-border">
                    <button onClick={() => setActiveFolder('inbox')} className={`w-full flex items-center gap-2 p-2 rounded-md text-sm font-medium ${activeFolder === 'inbox' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Inbox size={16} /> Inbox</button>
                    <button onClick={() => setActiveFolder('sent')} className={`w-full flex items-center gap-2 p-2 rounded-md text-sm font-medium ${activeFolder === 'sent' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Send size={16} /> Sent</button>
                </div>
                <ul className="overflow-y-auto">
                    {isLoading ? <p className="p-4 text-muted-foreground">Loading...</p> : messages.length > 0 ? messages.map((item) => (
                        <li key={item.id} onClick={() => handleSelectMessage(item)} className={`p-4 border-b border-border cursor-pointer hover:bg-muted ${selectedMessage?.id === item.id ? 'bg-muted' : ''}`}>
                            <p className={`text-md font-semibold ${!item.isRead && activeFolder === 'inbox' ? 'text-foreground' : 'text-muted-foreground'}`}>{activeFolder === 'inbox' ? item.senderName : `To: ${item.recipientId}`}</p>
                            <p className={`text-sm truncate ${!item.isRead && activeFolder === 'inbox' ? 'text-foreground' : 'text-muted-foreground'}`}>{item.subject}</p>
                        </li>
                    )) : <p className="p-4 text-muted-foreground">No messages in this folder.</p>}
                </ul>
            </div>
            <div className="w-2/3 p-6 overflow-y-auto flex flex-col">
                {isComposing ? (
                    <ComposeMessageForm 
                        onSend={handleSend}
                        onClose={() => setIsComposing(false)}
                        initialRecipient={composeInitialData.recipient}
                        initialSubject={composeInitialData.subject}
                        initialBody={composeInitialData.body}
                    />
                ) : selectedMessage ? (
                    <div className="flex-grow flex flex-col">
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
                            <p className="text-sm text-muted-foreground mb-6">{activeFolder === 'inbox' ? `From: ${selectedMessage.senderName}` : `To: ${selectedMessage.recipientId}`}</p>
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{selectedMessage.body}</div>
                        </div>
                        
                        {activeFolder === 'inbox' && (selectedMessage.status === 'new' || selectedMessage.status === 'pending') && (
                            <div className="mt-8 pt-6 border-t border-border flex items-center justify-end space-x-3">
                                <button onClick={() => handleDecline(selectedMessage)} disabled={isActionLoading} className="flex items-center gap-2 bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-rose-700 disabled:opacity-50"><XCircle size={16} /> Decline</button>
                                <button onClick={() => handlePending(selectedMessage)} disabled={isActionLoading} className="flex items-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50"><Clock size={16} /> Mark as Pending</button>
                                <button onClick={() => handleApprove(selectedMessage)} disabled={isActionLoading} className="flex items-center gap-2 bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 w-36 justify-center">
                                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                    {isActionLoading ? 'Please wait...' : 'Approve & Book'}
                                </button>
                            </div>
                        )}
                        {selectedMessage.status === 'approved' && (<p className="mt-4 p-3 text-sm text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-md">✅ This appointment has been approved and added to your calendar.</p>)}
                        {selectedMessage.status === 'declined' && (<p className="mt-4 p-3 text-sm text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-md">❌ This request was declined.</p>)}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Select a message to read.</p></div>
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