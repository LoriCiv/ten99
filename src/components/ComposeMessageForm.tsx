// src/components/ComposeMessageForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { Send, X as XIcon, Loader2 } from 'lucide-react';

interface ComposeMessageFormProps {
    onSend: (to: string, subject: string, body: string) => Promise<boolean>;
    onClose: () => void;
    isSending: boolean;
    // ✅ FIX: Added the initialData prop to be accepted by the component
    initialData?: {
        recipient: string;
        subject: string;
        body: string;
    };
}

export default function ComposeMessageForm({ onSend, onClose, isSending, initialData }: ComposeMessageFormProps) {
    // ✅ FIX: Use initialData to set the default state for the form fields
    const [recipient, setRecipient] = useState(initialData?.recipient || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [body, setBody] = useState(initialData?.body || '');
    const [error, setError] = useState('');

    // This ensures that if the user clicks "Reply" on another message while this is open, the form updates.
    useEffect(() => {
        if (initialData) {
            setRecipient(initialData.recipient);
            setSubject(initialData.subject);
            setBody(initialData.body);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !subject) {
            setError('Recipient and Subject are required.');
            return;
        }
        setError('');
        const success = await onSend(recipient, subject, body);
        if (success) {
            // The parent component will handle closing the form
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full p-4 bg-background">
            <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-xl font-bold">Compose Message</h2>
                <button type="button" onClick={onClose} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full">
                    <XIcon size={20} />
                </button>
            </div>
            <div className="py-4 space-y-4">
                <div>
                    <label htmlFor="recipient" className="sr-only">To:</label>
                    <input
                        id="recipient"
                        type="email"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="To:"
                        required
                        className="w-full p-2 bg-transparent border-b focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="sr-only">Subject:</label>
                    <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        required
                        className="w-full p-2 bg-transparent border-b focus:outline-none font-semibold"
                    />
                </div>
            </div>
            <div className="flex-grow">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-full p-2 bg-transparent resize-none focus:outline-none"
                    placeholder="Your message here..."
                />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <div className="pt-4 border-t">
                <button type="submit" disabled={isSending} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </form>
    );
}