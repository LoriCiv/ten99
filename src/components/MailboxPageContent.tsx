"use client";

import { useState, useEffect, useMemo, Suspense, ElementType } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2, Search, Check, X as XIcon, Send, RotateCcw, Clock, CalendarCheck, CornerDownLeft, Pencil, PackageOpen, Loader2, Inbox, SendHorizontal, CheckCircle, Hourglass, BookOpen, ThumbsUp, Info } from 'lucide-react';
import type { Message, JobPosting, Appointment, UserProfile } from '@/types/app-interfaces';
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
    confirmInboundOffer,
    createEducationAppointmentFromMessage,
    getUserProfile,
    markAsEducation
} from '@/utils/firestoreService';
import ComposeMessageForm from '@/components/ComposeMessageForm';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Modal from '@/components/Modal';
import { useFirebase } from './FirebaseProvider';

type MailboxFolder = 'inbox' | 'sent' | 'approved' | 'pending' | 'education';

// A small component for confirmation dialogs
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

// This internal component holds all the state and logic for the mailbox.
function MailboxPageContentInternal({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase();
    const searchParams = useSearchParams();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<MailboxFolder>('inbox');
    const [searchTerm, setSearchTerm] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [composeInitialData, setComposeInitialData] = useState<{recipients: string[], subject: string, body: string}>();
    
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [educationFormData, setEducationFormData] = useState({ date: '', time: '' });
    
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
            const unsubMessages = activeFolder === 'sent'
                ? getSentMessagesForUser(userId, setMessages)
                : getMessagesForUser(userId, setMessages);
            
            const unsubProfile = getUserProfile(userId, (profile) => {
                setUserProfile(profile);
                const unsubJobs = getJobPostings(setJobPostings, profile);
                setIsLoading(false);
                return () => unsubJobs(); 
            });
            
            setSelectedMessage(null);
            return () => {
                unsubMessages();
                unsubProfile();
            };
        }
    }, [isFirebaseAuthenticated, activeFolder, userId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const filteredMessages = useMemo(() => {
        let items = messages;
        if (activeFolder === 'inbox') items = messages.filter(m => m.status === 'new' || m.status === undefined || m.status === 'offer-sent');
        else if (activeFolder === 'approved') items = messages.filter(m => m.status === 'approved');
        else if (activeFolder === 'pending') items = messages.filter(m => m.status === 'pending' || m.status === 'offer-pending');
        else if (activeFolder === 'education') items = messages.filter(m => m.status === 'archived-education');
        
        const sortedItems = items.sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });

        if (!searchTerm) return sortedItems;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedItems.filter(message => 
            (message.senderName?.toLowerCase() || '').includes(lowercasedTerm) ||
            (message.subject?.toLowerCase() || '').includes(lowercasedTerm) ||
            (message.body?.toLowerCase() || '').includes(lowercasedTerm)
        );
    }, [messages, searchTerm, activeFolder]);

    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        setIsComposing(false);
        if (activeFolder === 'inbox' && !message.isRead && message.id) {
            updateMessage(userId, message.id, { isRead: true });
        }
    };

    const handleCompose = () => {
        setComposeInitialData(undefined);
        setSelectedMessage(null);
        setIsComposing(true);
    };
    
    const handleReply = () => {
        if (!selectedMessage?.createdAt || !(selectedMessage.createdAt instanceof Timestamp)) return;
        const dateString = selectedMessage.createdAt.toDate().toLocaleString();
        const quotedBody = `\n\n--- On ${dateString}, ${selectedMessage.senderName} wrote: ---\n> ${selectedMessage.body.replace(/\n/g, '\n> ')}`;
        setComposeInitialData({
            recipients: [selectedMessage.senderId],
            subject: `Re: ${selectedMessage.subject}`,
            body: quotedBody
        });
        setSelectedMessage(null);
        setIsComposing(true);
    };

    const handleSend = async (recipients: string[], subject: string, body: string) => {
        if (!userId || !userProfile) return false;
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
        if (!selectedMessage || !selectedMessage.id) return;
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

    const performAction = async (actionLogic: () => Promise<void>, successMessage: string) => {
        if (!selectedMessage?.id) return;
        setIsActionLoading(true);
        try {
            await actionLogic();
            showStatusMessage("success", successMessage);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Mailbox action failed:", error);
            showStatusMessage("error", `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleMarkAsEducation = () => {
        if (!selectedMessage) return;
        if (selectedMessage.appointmentId) {
            performAction(() => markAsEducation(userId, selectedMessage), 'Event marked as education and scheduled!');
        } else {
            setEducationFormData({ date: '', time: '' });
            setIsEducationModalOpen(true);
        }
    };

    const handleScheduleEducation = async () => {
        if (!selectedMessage || !educationFormData.date || !educationFormData.time) {
            showStatusMessage("error", "Please provide both a date and a time.");
            return;
        }
        const appointmentData: Partial<Appointment> = {
            subject: selectedMessage.subject,
            date: educationFormData.date,
            time: educationFormData.time,
            eventType: 'education',
            status: 'scheduled',
            notes: `Event scheduled from email:\nFrom: ${selectedMessage.senderName}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`
        };
        await performAction(() => createEducationAppointmentFromMessage(userId, selectedMessage, appointmentData), 'Education event scheduled successfully!');
        setIsEducationModalOpen(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    const ActionButton = ({ onClick, disabled, icon: Icon, text, variant = 'primary' }: { onClick: () => void; disabled: boolean; icon: ElementType; text: string; variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'; }) => { const variants: Record<string, string> = { primary: 'bg-primary text-primary-foreground hover:bg-primary/90', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', success: 'bg-emerald-600 text-white hover:bg-emerald-700', danger: 'bg-rose-600 text-white hover:bg-rose-700', warning: 'bg-amber-500 text-white hover:bg-amber-600' }; return (<button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variants[variant]}`}> {disabled ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16}/>} {text} </button>); };
    const relatedJobPost = selectedMessage?.jobPostId ? jobPostings.find(p => p.id === selectedMessage.jobPostId) : null;
    const FolderButton = ({ folderName, label, icon: Icon, count }: { folderName: MailboxFolder, label: string, icon: ElementType, count?: number }) => ( <button onClick={() => setActiveFolder(folderName)} className={`flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeFolder === folderName ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><div className="flex items-center gap-3"><Icon size={18} /><span>{label}</span></div>{count !== undefined && count > 0 && ( <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">{count}</span> )}</button> );
    const messageListComponent = ( <div className="flex flex-col h-full border-r"><div className="p-4 border-b shrink-0"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Mailbox</h2><button onClick={handleCompose} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-3 rounded-lg hover:bg-primary/90"><Pencil size={16} /> Compose</button></div><div className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search..." className="w-full bg-background border rounded-md pl-9 pr-3 py-2 text-sm"/></div></div><nav className="p-2 border-b"><FolderButton folderName="inbox" label="Inbox" icon={Inbox} count={messages.filter(m => !m.isRead && (m.status === 'new' || m.status === undefined || m.status === 'offer-sent')).length} /><FolderButton folderName="sent" label="Sent" icon={SendHorizontal} /><FolderButton folderName="approved" label="Approved Jobs" icon={CheckCircle} /><FolderButton folderName="pending" label="Pending Jobs" icon={Hourglass} /><FolderButton folderName="education" label="Education" icon={BookOpen} /></nav><div className="overflow-y-auto flex-grow">{filteredMessages.length > 0 ? filteredMessages.map(message => ( <div key={message.id} onClick={() => handleSelectMessage(message)} className={`p-4 border-b cursor-pointer hover:bg-muted ${selectedMessage?.id === message.id ? 'bg-muted' : ''} ${!message.isRead && activeFolder === 'inbox' ? 'font-bold' : ''}`}><div className="flex justify-between text-sm"><p className="truncate">{activeFolder === 'inbox' ? message.senderName : `To: ${message.recipientId}`}</p><p className="text-xs shrink-0 pl-2">{message.createdAt instanceof Timestamp ? format(message.createdAt.toDate(), 'MMM d') : ''}</p></div><p className="text-sm truncate">{message.subject}</p></div> )) : <div className="text-center p-8 text-muted-foreground">No messages</div>}</div></div> );
    const detailComponent = ( <div className="flex flex-col h-full">{isComposing ? ( <ComposeMessageForm onSend={handleSend} onClose={() => setIsComposing(false)} initialData={composeInitialData} isSending={isActionLoading} /> ) : selectedMessage ? ( <><div className="p-4 border-b shrink-0"><button onClick={() => setSelectedMessage(null)} className="md:hidden flex items-center gap-2 text-sm font-semibold mb-4 text-primary"><ArrowLeft size={16}/> Back</button><div className="flex justify-between items-start"><div><h3 className="text-xl font-bold">{selectedMessage.subject}</h3><p className="text-sm text-muted-foreground">From: {selectedMessage.senderName} ({selectedMessage.senderId})</p><p className="text-xs text-muted-foreground">Date: {selectedMessage.createdAt instanceof Timestamp ? selectedMessage.createdAt.toDate().toLocaleString() : ''}</p></div><div className="flex gap-2"><button onClick={handleReply} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full"><CornerDownLeft size={18}/></button><button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full"><Trash2 size={18}/></button></div></div></div><div className="p-6 overflow-y-auto flex-grow"><p className="text-base whitespace-pre-wrap">{selectedMessage.body}</p>{activeFolder === 'inbox' && ( <div className="mt-8 pt-6 border-t space-y-4">{ (selectedMessage.type === 'application' || selectedMessage.type === 'offer') && (<><h3 className="font-semibold">Job Actions</h3><div className="flex flex-wrap gap-2">{selectedMessage.type === 'application' && selectedMessage.status === 'new' && !relatedJobPost?.isFilled && (!relatedJobPost?.pendingApplicantId ? (<><ActionButton onClick={() => performAction(() => sendJobOffer(selectedMessage), 'Offer sent!')} disabled={isActionLoading} icon={Send} text="Send Offer" variant="primary" /><ActionButton onClick={() => performAction(() => declineJobApplication(selectedMessage), 'Application declined.')} disabled={isActionLoading} icon={XIcon} text="Decline" variant="danger"/></>) : relatedJobPost.pendingApplicantId === selectedMessage.senderId ? (<p className="text-sm text-amber-600">You have a pending offer.</p>) : (<p className="text-sm text-muted-foreground">Offer is pending with another.</p>))} {selectedMessage.type === 'application' && selectedMessage.status === 'offer-pending' && (<ActionButton onClick={() => performAction(() => rescindJobOffer(selectedMessage), 'Offer rescinded.')} disabled={isActionLoading} icon={RotateCcw} text="Rescind Offer" variant="warning"/>)} {selectedMessage.type === 'offer' && selectedMessage.status === 'new' && (<><ActionButton onClick={() => performAction(() => acceptJobOffer(selectedMessage), 'Offer Accepted!')} disabled={isActionLoading} icon={Check} text="Accept Offer" variant="success" /><ActionButton onClick={() => performAction(() => declineJobOffer(selectedMessage), 'Offer Declined.')} disabled={isActionLoading} icon={XIcon} text="Decline Offer" variant="danger"/></>)}</div></>) }{ selectedMessage.type === 'inbound-offer' && ( <><h3 className="font-semibold">Inbound Actions</h3><div className="flex flex-wrap gap-2">{selectedMessage.status === 'new' && ( <><ActionButton onClick={() => performAction(() => confirmInboundOffer(userId, selectedMessage), 'Appointment Confirmed!')} disabled={isActionLoading} icon={CalendarCheck} text="Confirm & Book" variant="success"/><ActionButton onClick={() => performAction(() => acceptInboundOfferPending(userId, selectedMessage), 'Replied to Sender.')} disabled={isActionLoading} icon={Clock} text="Accept Pending" variant="warning"/><ActionButton onClick={handleMarkAsEducation} disabled={isActionLoading} icon={BookOpen} text="Mark as Education" variant="secondary"/><ActionButton onClick={() => performAction(() => declineInboundOffer(userId, selectedMessage), 'Declined & Replied.')} disabled={isActionLoading} icon={XIcon} text="Decline" variant="danger"/></> )}{selectedMessage.status === 'pending' && ( <ActionButton onClick={() => performAction(() => confirmInboundOffer(userId, selectedMessage), 'Appointment Confirmed!')} disabled={isActionLoading} icon={CalendarCheck} text="Confirm & Book" variant="success"/> )}</div></> ) }{['approved', 'declined', 'offer-rescinded', 'pending', 'archived-education'].includes(selectedMessage.status || '') && ( <p className="text-sm font-semibold text-muted-foreground mt-4">Actioned. Status: &apos;{selectedMessage.status}&apos;.</p> )}</div> )}</div></> ) : ( <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4"><PackageOpen size={64}/><p className="text-lg">Select a message to read</p></div> )}</div> );
    
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
                <div className="hidden md:flex h-full"><PanelGroup direction="horizontal"><Panel defaultSize={35} minSize={25}>{messageListComponent}</Panel><PanelResizeHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors" /><Panel minSize={30}>{detailComponent}</Panel></PanelGroup></div>
            </div>
            <Modal isOpen={isEducationModalOpen} onClose={() => setIsEducationModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Schedule Education Event</h2>
                    <p className="text-sm text-muted-foreground mb-4">Please set the date and time for this workshop.</p>
                    <div className="space-y-4">
                        <div><label htmlFor="educationDate" className="block text-sm font-medium">Date</label><input type="date" id="educationDate" value={educationFormData.date} onChange={(e) => setEducationFormData(prev => ({...prev, date: e.target.value}))} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                        <div><label htmlFor="educationTime" className="block text-sm font-medium">Time</label><input type="time" id="educationTime" value={educationFormData.time} onChange={(e) => setEducationFormData(prev => ({...prev, time: e.target.value}))} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => setIsEducationModalOpen(false)} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                        <button onClick={handleScheduleEducation} disabled={isActionLoading} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">{isActionLoading ? <Loader2 size={16} className="animate-spin"/> : <CalendarCheck size={16}/>}Schedule Event</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// This is the main export that wraps the internal component with Suspense
export default function MailboxPageContent({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Mailbox...</div>}>
            <MailboxPageContentInternal userId={userId} />
        </Suspense>
    );
}