"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// ✅ Import Search icon
import { Pencil, ArrowLeft, Trash2, Search } from 'lucide-react';
import type { Message } from '@/types/app-interfaces';
import { getMessagesForUser, getSentMessagesForUser, sendAppMessage, updateMessage, approveMessageAndCreateAppointment, deleteMessage } from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';

const TEMP_USER_ID = "dev-user-1";
const TEMP_USER_NAME = "Dev User";

function MailboxPageInternal() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');
    // ✅ State for the search term
    const [searchTerm, setSearchTerm] = useState('');
    
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

    // ✅ Filter messages based on search term
    const filteredMessages = useMemo(() => {
        if (!searchTerm) {
            return messages;
        }
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
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error approving message:", error);
            alert(`Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

                {/* ✅ Search input for the message list */}
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 text-sm border rounded-md bg-background"
                        />
                    </div>
                </div>

                <ul className="overflow-y-auto">
                    {/* ✅ Use the filteredMessages array for rendering */}
                    {filteredMessages.map(message => (
                        <li key={message.id} onClick={() => handleSelectMessage(message)} className={`p-4 border-b cursor-pointer ${selectedMessage?.id === message.id ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                            <p className={`font-semibold ${!message.isRead && activeFolder === 'inbox' ? 'text-primary' : ''}`}>{message.senderName}</p>
                            <p className="text-sm truncate">{message.subject}</p>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className={`w-full md:w-2/3 p-6 overflow-y-auto ${!selectedMessage && !isComposing ? 'hidden' : 'block'} md:block`}>
                 {isComposing ? (
                      <ComposeMessageForm onSend={handleSend} onClose={() => setIsComposing(false)} initialRecipient={initialRecipient || ''} />
                 ) : selectedMessage ? (
                      <div>
                          <div className="flex justify-between items-start">
                              <button onClick={() => setSelectedMessage(null)} className="md:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                                  <ArrowLeft size={16} />
                                  Back to {activeFolder === 'inbox' ? 'Inbox' : 'Sent'}
                              </button>
                              <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted ml-auto">
                                <Trash2 size={18} />
                                <span className="sr-only">Delete message</span>
                              </button>
                          </div>
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