// src/app/dashboard/mailbox/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Send, Inbox, Trash2, Check, X as AlertX, AlertTriangle } from 'lucide-react';
import type { Message, Template } from '@/types/app-interfaces';
import { getMessagesForUser, getSentMessagesForUser, sendAppMessage, updateMessage, getTemplates, approveMessageAndCreateAppointment } from '@/utils/firestoreService';
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
    const [actionState, setActionState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });
    
    const initialRecipient = searchParams.get('to');

    useEffect(() => {
        if (initialRecipient && !isComposing) {
            setIsComposing(true);
        }
    }, [initialRecipient, isComposing]);

    useEffect(() => {
        setIsLoading(true);
        const unsub = activeFolder === 'inbox'
            ? getMessagesForUser(TEMP_USER_ID, (data) => {
                setMessages(data);
                setIsLoading(false);
            })
            : getSentMessagesForUser(TEMP_USER_ID, (data) => {
                setMessages(data);
                setIsLoading(false);
            });
        
        getTemplates(TEMP_USER_ID, setTemplates);
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
        } catch (error) { // ✅ FIX: Using the 'error' variable
            console.error("Error sending message:", error);
            alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    };
    
    const handleApprove = async () => {
        if (!selectedMessage) return;
        setActionState({ status: 'loading', message: 'Approving...' });
        try {
            await approveMessageAndCreateAppointment(TEMP_USER_ID, selectedMessage);
            setActionState({ status: 'success', message: 'Appointment created successfully!' });
        } catch (error) { // ✅ FIX: Using the 'error' variable
            console.error("Error approving message:", error);
            setActionState({ status: 'error', message: `Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
    };

    // The rest of the component's functions and JSX are correct.
    // For brevity, the full JSX is omitted here but should be in your file.
    // If you need the full component again, just let me know.
    
    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            {/* Left Panel: Folders and Message List */}
            <div className="w-1/3 border-r border-border flex flex-col">
                 {/* ... (header and folder buttons) ... */}
                 {/* Message List */}
                 <ul className="overflow-y-auto">
                     {/* ... (message list mapping logic) ... */}
                 </ul>
            </div>
            {/* Right Panel: Message Detail or Compose */}
            <div className="w-2/3 p-6 overflow-y-auto">
                 {isComposing ? (
                     <ComposeMessageForm
                        onSend={handleSend}
                        onClose={() => setIsComposing(false)}
                        initialRecipient={initialRecipient || ''}
                     />
                 ) : selectedMessage ? (
                     <div>
                         {/* ... (message detail and action buttons) ... */}
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