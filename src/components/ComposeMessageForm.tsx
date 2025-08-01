"use client";

import { useState, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';

interface ComposeMessageFormProps {
    onSend: (recipients: string[], subject: string, body: string) => Promise<boolean>;
    onClose: () => void;
    initialData?: { recipient?: string; recipients?: string[]; subject: string; body: string; };
    isSending: boolean;
}

export default function ComposeMessageForm({ onSend, onClose, initialData, isSending }: ComposeMessageFormProps) {
    const [recipients, setRecipients] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            // This correctly handles both single and multiple recipients for replies vs. new messages
            const initialRecipients = initialData.recipients || (initialData.recipient ? [initialData.recipient] : []);
            setRecipients(initialRecipients);
            setSubject(initialData.subject || '');
            setBody(initialData.body || '');
        }
    }, [initialData]);

    // This function adds the text from the input into a "pill"
    const handleAddRecipient = () => {
        const newRecipient = recipientInput.trim();
        // The backend can distinguish between emails and UIDs, so we don't need strict validation here.
        if (newRecipient && !recipients.includes(newRecipient)) {
            setRecipients([...recipients, newRecipient]);
            setRecipientInput('');
            setError('');
        }
    };

    const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Adds a recipient when the user presses Enter, Comma, or Space
        if (['Enter', ',', ' '].includes(e.key)) {
            e.preventDefault();
            handleAddRecipient();
        }
    };
    
    const removeRecipient = (indexToRemove: number) => {
        setRecipients(recipients.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Make sure to add any text still in the input field to the list before sending
        let finalRecipients = [...recipients];
        const newRecipient = recipientInput.trim();
        if (newRecipient && !finalRecipients.includes(newRecipient)) {
            finalRecipients.push(newRecipient);
        }
        
        if (finalRecipients.length === 0) {
            setError('Please add at least one recipient.');
            return;
        }

        if (!subject || !body) {
            setError('Please fill out the subject and body.');
            return;
        }

        setError('');
        onSend(finalRecipients, subject, body);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Compose Message</h3>
                <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                    <X size={20}/>
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">To:</label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background min-h-[42px] mt-1">
                        {recipients.map((email, index) => (
                            <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-medium px-2 py-1 rounded-full">
                                <span>{email}</span>
                                <button type="button" onClick={() => removeRecipient(index)} className="text-muted-foreground hover:text-foreground">
                                    <X size={14}/>
                                </button>
                            </div>
                        ))}
                        <input
                            type="text" // Changed to text to allow for UIDs
                            value={recipientInput}
                            onChange={(e) => setRecipientInput(e.target.value)}
                            onKeyDown={handleRecipientKeyDown}
                            placeholder="Add email or user..."
                            className="flex-grow bg-transparent outline-none p-1"
                        />
                    </div>
                    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
                </div>
                <div>
                    <label htmlFor="subject" className="text-sm font-medium text-muted-foreground">Subject:</label>
                    <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} type="text" className="w-full mt-1 p-2 bg-background border rounded-md" />
                </div>
            </div>
            <div className="p-4 flex-grow">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your message here..." className="w-full h-full p-2 bg-background border rounded-md resize-none" />
            </div>
            <div className="p-4 border-t flex justify-end">
                <button type="submit" disabled={isSending} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </form>
    );
}