"use client";

import { useState, useEffect, useMemo, Suspense, ElementType } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2, Search, Check, X as XIcon, Send, RotateCcw, Clock, CalendarCheck, CornerDownLeft, Pencil, PackageOpen, Loader2 } from 'lucide-react';
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
import { format } from 'date-fns';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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
            (message.senderName?.toLowerCase() || '').includes(lowercasedTerm) ||
            (message.subject?.toLowerCase() || '').includes(lowercasedTerm) ||
            (message.body?.toLowerCase() || '').includes(lowercasedTerm)
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
        setIsActionLoading(true);
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
        } finally {
            setIsActionLoading(false);
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

    const performAction = async (actionLogic: () => Promise<void>, newStatus: Message['status'], successMessage: string) => {
        if (!selectedMessage?.id) return;
        const originalMessageId = selectedMessage.id;
        
        setIsActionLoading(true);
        try {
            await actionLogic();
            alert(successMessage);
            const updatedMessages = messages.map(m => m.id === originalMessageId ? { ...m, status: newStatus } : m);
            setMessages(updatedMessages);
            setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error("Mailbox action failed:", error);
            alert(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    interface ActionButtonProps {
        onClick: () => void;
        disabled: boolean;
        icon: ElementType;
        text: string;
        variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
    }
    
    const ActionButton = ({ onClick, disabled, icon: Icon, text, variant = 'primary' }: ActionButtonProps) => {
        const variants: Record<string, string> = {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            success: 'bg-emerald-600 text-white hover:bg-emerald-700',
            danger: 'bg-rose-600 text-white hover:bg-rose-700',
            warning: 'bg-amber-500 text-white hover:bg-amber-600',
        };
        return (
            <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variants[variant]}`}>
                {disabled ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16}/>}
                {text}
            </button>
        );
    };

    const relatedJobPost = selectedMessage?.jobPostId ? jobPostings.find(p => p.id === selectedMessage.jobPostId) : null;

    const messageListComponent = (
        <div className="flex flex-col h-full border-r">
            <div className="p-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Mailbox</h2>
                    <button onClick={handleCompose} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-3 rounded-lg hover:bg-primary/90">
                        <Pencil size={16} /> Compose
                    </button>
                </div>
                <div className="flex gap-2 mt-4 border-b">
                    <button onClick={() => setActiveFolder('inbox')} className={`pb-2 px-2 text-sm font-semibold ${activeFolder === 'inbox' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Inbox ({messages.filter(m => !m.isRead).length})</button>
                    <button onClick={() => setActiveFolder('sent')} className={`pb-2 px-2 text-sm font-semibold ${activeFolder === 'sent' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Sent</button>
                </div>
                 <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search..." className="w-full bg-background border rounded-md pl-9 pr-3 py-2 text-sm"/>
                </div>
            </div>
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
                <ComposeMessageForm 
                    onSend={handleSend} 
                    onClose={() => setIsComposing(false)} 
                    initialData={composeInitialData}
                    isSending={isActionLoading}
                />
            ) : selectedMessage ? (
                <>
                    <div className="p-4 border-b shrink-0">
                        <button onClick={() => setSelectedMessage(null)} className="md:hidden flex items-center gap-2 text-sm font-semibold mb-4 text-primary"><ArrowLeft size={16}/> Back to Inbox</button>
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
                        {activeFolder === 'inbox' && (
                           <div className="mt-8 pt-6 border-t space-y-4">
                                { (selectedMessage.type === 'application' || selectedMessage.type === 'offer') && (
                                   <><h3 className="font-semibold">Job Board Actions</h3><div className="flex flex-wrap gap-2">{selectedMessage.type === 'application' && selectedMessage.status === 'new' && !relatedJobPost?.isFilled && (!relatedJobPost?.pendingApplicantId ? (<><ActionButton onClick={() => performAction(() => sendJobOffer(selectedMessage), 'offer-pending', 'Offer sent!')} disabled={isActionLoading} icon={Send} text="Send Offer" variant="primary" /><ActionButton onClick={() => performAction(() => declineJobApplication(selectedMessage), 'declined', 'Application declined.')} disabled={isActionLoading} icon={XIcon} text="Decline" variant="danger"/></>) : relatedJobPost.pendingApplicantId === selectedMessage.senderId ? (<p className="text-sm text-amber-600">You have a pending offer with this applicant.</p>) : (<p className="text-sm text-muted-foreground">An offer is pending with another applicant for this job.</p>))} {selectedMessage.type === 'application' && selectedMessage.status === 'offer-pending' && (<ActionButton onClick={() => performAction(() => rescindJobOffer(selectedMessage), 'new', 'Offer rescinded.')} disabled={isActionLoading} icon={RotateCcw} text="Rescind Offer" variant="warning"/>)} {selectedMessage.type === 'offer' && selectedMessage.status === 'new' && (<><ActionButton onClick={() => performAction(() => acceptJobOffer(selectedMessage), 'approved', 'Offer Accepted!')} disabled={isActionLoading} icon={Check} text="Accept Offer" variant="success" /><ActionButton onClick={() => performAction(() => declineJobOffer(selectedMessage), 'declined', 'Offer Declined.')} disabled={isActionLoading} icon={XIcon} text="Decline Offer" variant="danger"/></>)}</div></>
                                )}
                                { selectedMessage.type === 'inbound-offer' && (
                                    <>
                                        <h3 className="font-semibold">Inbound Offer Actions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMessage.status === 'new' && (
                                                <>
                                                    <ActionButton onClick={() => performAction(() => confirmInboundOffer(TEMP_USER_ID, selectedMessage), 'approved', 'Appointment Confirmed!')} disabled={isActionLoading} icon={CalendarCheck} text="Confirm & Book" variant="success"/>
                                                    <ActionButton onClick={() => performAction(() => acceptInboundOfferPending(TEMP_USER_ID, selectedMessage), 'pending', 'Replied to Sender.')} disabled={isActionLoading} icon={Clock} text="Accept Pending" variant="warning"/>
                                                    <ActionButton onClick={() => performAction(() => declineInboundOffer(TEMP_USER_ID, selectedMessage), 'declined', 'Declined & Replied.')} disabled={isActionLoading} icon={XIcon} text="Decline" variant="danger"/>
                                                </>
                                            )}
                                            {selectedMessage.status === 'pending' && (
                                                <ActionButton onClick={() => performAction(() => confirmInboundOffer(TEMP_USER_ID, selectedMessage), 'approved', 'Appointment Confirmed!')} disabled={isActionLoading} icon={CalendarCheck} text="Confirm & Book" variant="success"/>
                                            )}
                                        </div>
                                    </>
                                )}
                                {['approved', 'declined', 'offer-rescinded', 'pending'].includes(selectedMessage.status || '') && (
                                    <p className="text-sm font-semibold text-muted-foreground mt-4">This conversation has been actioned. Status: &apos;{selectedMessage.status}&apos;.</p>
                                )}
                            </div>
                        )}
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
        <div className="h-[calc(100vh-8rem)] bg-card border rounded-lg overflow-hidden">
            <div className="md:hidden h-full">
                {selectedMessage || isComposing ? detailComponent : messageListComponent}
            </div>
            <div className="hidden md:flex h-full">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={35} minSize={25}>
                        {messageListComponent}
                    </Panel>
                    <PanelResizeHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors" />
                    <Panel minSize={30}>
                        {detailComponent}
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}

export default function MailboxPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<div className="text-center p-8">Loading Mailbox...</div>}>
                <MailboxPageInternal />
            </Suspense>
        </div>
    );
}