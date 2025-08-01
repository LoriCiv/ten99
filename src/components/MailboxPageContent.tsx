// src/components/MailboxPageContent.tsx

"use client";

import { useState, useEffect, useMemo, Suspense, ElementType } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2, Search, CornerDownLeft, Pencil, PackageOpen, Loader2, Inbox, SendHorizontal, ThumbsUp, Info, X as XIcon } from 'lucide-react';
import type { Message, UserProfile, JobPosting } from '@/types/app-interfaces';
import {
    getMessagesForUser,
    getSentMessagesForUser,
    sendAppMessage,
    updateMessage,
    deleteMessage,
    getUserProfile,
    getJobPostings
} from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useFirebase } from './FirebaseProvider';

type MailboxFolder = 'inbox' | 'sent';

const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md border p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground my-4">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-muted text-muted-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted/80">Cancel</button>
                <button onClick={onConfirm} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90">Confirm</button>
            </div>
        </div>
    </div>
);

function MailboxPageContentInternal({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase();
    const searchParams = useSearchParams();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<MailboxFolder>('inbox');
    const [searchTerm, setSearchTerm] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [composeInitialData, setComposeInitialData] = useState<{recipients: string[], subject: string, body: string}>();
    
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    const initialRecipient = searchParams.get('to');

    useEffect(() => {
        if (initialRecipient && !isComposing) { 
            setComposeInitialData({ recipients: [initialRecipient], subject: '', body: ''});
            setIsComposing(true); 
        }
    }, [initialRecipient, isComposing]);

    useEffect(() => {
        if (isFirebaseAuthenticated) {
            const unsubMessages = activeFolder === 'sent' ? getSentMessagesForUser(userId, setMessages) : getMessagesForUser(userId, setMessages);
            const unsubProfile = getUserProfile(userId, (profile) => {
                setUserProfile(profile);
                setIsLoading(false);
            });
            setSelectedMessage(null);
            return () => { unsubMessages(); unsubProfile(); };
        }
    }, [isFirebaseAuthenticated, activeFolder, userId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const filteredMessages = useMemo(() => {
        const sortedItems = messages.sort((a,b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
        if (!searchTerm) return sortedItems;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedItems.filter(message => 
            (message.senderName?.toLowerCase() || '').includes(lowercasedTerm) || 
            (message.subject?.toLowerCase() || '').includes(lowercasedTerm) || 
            (message.body?.toLowerCase() || '').includes(lowercasedTerm)
        );
    }, [messages, searchTerm]);

    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        setIsComposing(false);
        if (activeFolder === 'inbox' && !message.isRead && message.id && userId) {
            updateMessage(userId, message.id, { isRead: true });
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
        setComposeInitialData({ recipients: [selectedMessage.senderId], subject: `Re: ${selectedMessage.subject}`, body: quotedBody });
        setSelectedMessage(null);
        setIsComposing(true);
    };

    const handleSend = async (recipients: string[], subject: string, body: string): Promise<boolean> => {
        if (!userId || !userProfile) {
            console.error("Send failed: User profile is not loaded yet.");
            showStatusMessage("error", "Your user profile is still loading. Please wait a moment and try again.");
            return false;
        }

        setIsActionLoading(true);
        try {
            await sendAppMessage(userId, userProfile.name || "A Ten99 User", recipients, subject, body);
            showStatusMessage("success", "Message sent!");
            setIsComposing(false);
            setActiveFolder('sent');
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            showStatusMessage("error", `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleDelete = () => {
        if (!selectedMessage || !selectedMessage.id || !userId) return;
        setConfirmation({
            title: "Delete Message?",
            message: "Are you sure you want to permanently delete this message?",
            onConfirm: async () => {
                try {
                    await deleteMessage(userId, selectedMessage.id!);
                    showStatusMessage("success", "Message deleted.");
                    setSelectedMessage(null);
                } catch (error) {
                    console.error("Error deleting message:", error);
                    showStatusMessage("error", "Failed to delete message.");
                }
                setConfirmation(null);
            }
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    const FolderButton = ({ folderName, label, icon: Icon }: { folderName: MailboxFolder, label: string, icon: ElementType }) => ( 
        <button onClick={() => setActiveFolder(folderName)} className={`flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeFolder === folderName ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
            <div className="flex items-center gap-3"><Icon size={18} /><span>{label}</span></div>
        </button> 
    );
    
    const messageListComponent = ( 
        <div className="flex flex-col h-full border-r">
            <div className="p-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Mailbox</h2>
                    <button onClick={handleCompose} disabled={!userProfile} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-3 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                        <Pencil size={16} /> Compose
                    </button>
                </div>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search..." className="w-full bg-background border rounded-md pl-9 pr-3 py-2 text-sm"/>
                </div>
            </div>
            <nav className="p-2 border-b">
                <FolderButton folderName="inbox" label="Inbox" icon={Inbox} />
                <FolderButton folderName="sent" label="Sent" icon={SendHorizontal} />
            </nav>
            <div className="overflow-y-auto flex-grow">
                {filteredMessages.length > 0 ? filteredMessages.map(message => ( 
                    <div key={message.id} onClick={() => handleSelectMessage(message)} className={`p-4 border-b cursor-pointer hover:bg-muted ${selectedMessage?.id === message.id ? 'bg-muted' : ''} ${!message.isRead && activeFolder === 'inbox' ? 'font-bold' : ''}`}>
                        <div className="flex justify-between text-sm">
                            <p className="truncate">{activeFolder === 'inbox' ? message.senderName : `To: ${message.recipientId}`}</p>
                            <p className="text-xs shrink-0 pl-2">{message.createdAt instanceof Timestamp ? format(message.createdAt.toDate(), 'MMM d') : ''}</p>
                        </div>
                        <p className="text-sm truncate">{message.subject}</p>
                    </div> 
                )) : <div className="text-center p-8 text-muted-foreground">No messages</div>}
            </div>
        </div> 
    );
    
    const detailComponent = ( 
        <div className="flex flex-col h-full">
            {isComposing ? ( 
                <ComposeMessageForm onSend={handleSend} onClose={() => setIsComposing(false)} initialData={composeInitialData} isSending={isActionLoading} /> 
            ) : selectedMessage ? ( 
                <>
                    <div className="p-4 border-b shrink-0">
                        <button onClick={() => setSelectedMessage(null)} className="md:hidden flex items-center gap-2 text-sm font-semibold mb-4 text-primary"><ArrowLeft size={16}/> Back</button>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{selectedMessage.subject}</h3>
                                <p className="text-sm text-muted-foreground">From: {selectedMessage.senderName} ({selectedMessage.senderId})</p>
                                <p className="text-xs text-muted-foreground">Date: {selectedMessage.createdAt instanceof Timestamp ? selectedMessage.createdAt.toDate().toLocaleString() : ''}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleReply} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full"><CornerDownLeft size={18}/></button>
                                <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow">
                        <p className="text-base whitespace-pre-wrap">{selectedMessage.body}</p>
                    </div>
                </> 
            ) : ( 
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                    <PackageOpen size={64}/>
                    <p className="text-lg">Select a message to read</p>
                </div> 
            )}
        </div> 
    );
    
    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <button onClick={() => setStatusMessage(null)} className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10"><XIcon size={16}/></button>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}
            <div className="h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
                <div className="md:hidden h-full">{selectedMessage || isComposing ? detailComponent : messageListComponent}</div>
                <div className="hidden md:flex h-full">
                    <PanelGroup direction="horizontal">
                        <Panel defaultSize={35} minSize={25}>{messageListComponent}</Panel>
                        <PanelResizeHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors" />
                        <Panel minSize={30}>{detailComponent}</Panel>
                    </PanelGroup>
                </div>
            </div>
        </>
    );
}

export default function MailboxPageContent({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Mailbox...</div>}>
            <MailboxPageContentInternal userId={userId} />
        </Suspense>
    );
}