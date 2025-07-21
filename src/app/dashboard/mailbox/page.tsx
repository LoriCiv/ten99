// src/app/dashboard/mailbox/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// ✅ THE FIX: Removed all unused icons from this line
import { Pencil } from 'lucide-react';
import type { Message } from '@/types/app-interfaces';
// ✅ THE FIX: Removed unused 'getTemplates'
import { getMessagesForUser, getSentMessagesForUser, sendAppMessage, updateMessage, approveMessageAndCreateAppointment } from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';

const TEMP_USER_ID = "dev-user-1";
const TEMP_USER_NAME = "Dev User";

function MailboxPageInternal() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');
    
    const initialRecipient = searchParams.get('to');

    useEffect(() => {
        if (initialRecipient && !isComposing) {
            setIsComposing(true);
        }
    }, [initialRecipient, isComposing]);

    useEffect(() => {
        const unsub = activeFolder === 'inbox'
            ? getMessagesForUser(TEMP_USER_ID, setMessages)
            : getSentMessagesForUser(TEMP_USER_ID, setMessages);
        
        setSelectedMessage(null);
        return () => unsub();
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
    
    const handleApprove = async () => {
        if (!selectedMessage) return;
        try {
            await approveMessageAndCreateAppointment(TEMP_USER_ID, selectedMessage);
            alert("Appointment created successfully!");
            // After approving, deselect the message
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error approving message:", error);
            alert(`Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveFolder('inbox')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeFolder === 'inbox' ? 'bg-secondary' : 'hover:bg-muted'}`}>Inbox</button>
                        <button onClick={() => setActiveFolder('sent')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeFolder === 'sent' ? 'bg-secondary' : 'hover:bg-muted'}`}>Sent</button>
                    </div>
                    <button onClick={handleCompose} className="p-2 rounded-full hover:bg-muted"><Pencil size={18} /></button>
                </div>
                <ul className="overflow-y-auto">
                    {messages.map(message => (
                        <li key={message.id} onClick={() => handleSelectMessage(message)} className={`p-4 border-b cursor-pointer ${selectedMessage?.id === message.id ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                            <p className={`font-semibold ${!message.isRead && activeFolder === 'inbox' ? 'text-primary' : ''}`}>{message.senderName}</p>
                            <p className="text-sm truncate">{message.subject}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="w-2/3 p-6 overflow-y-auto">
                 {isComposing ? (
                     <ComposeMessageForm onSend={handleSend} onClose={() => setIsComposing(false)} initialRecipient={initialRecipient || ''} />
                 ) : selectedMessage ? (
                     <div>
                         <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
                         <p className="text-sm text-muted-foreground">From: {selectedMessage.senderName} &lt;{selectedMessage.senderId}&gt;</p>
                         <div className="mt-6 prose prose-sm max-w-none whitespace-pre-wrap">{selectedMessage.body}</div>
                         
                         {activeFolder === 'inbox' && selectedMessage.status === 'new' && (
                            <div className="mt-8 pt-6 border-t space-y-4">
                                <h3 className="font-semibold">Actions</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleApprove} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">
                                        Approve & Create Appointment
                                    </button>
                                </div>
                            </div>
                         )}
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