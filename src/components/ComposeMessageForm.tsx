"use client";

import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ComposeMessageFormProps {
    onSend: (to: string, subject: string, body: string) => Promise<boolean>;
    onClose: () => void;
    initialRecipient?: string;
    initialSubject?: string;
    initialBody?: string;
}

export default function ComposeMessageForm({ 
    onSend, 
    onClose, 
    initialRecipient = '', 
    initialSubject = '', 
    initialBody = '' 
}: ComposeMessageFormProps) {
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        setRecipient(initialRecipient);
        setSubject(initialSubject);
        setBody(initialBody);
    }, [initialRecipient, initialSubject, initialBody]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        const success = await onSend(recipient, subject, body);
        if (success) {
            // The parent component will handle closing on success
        } else {
            // If sending fails, allow the user to try again
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Compose Message</h2>
            </div>
            <div className="p-4 space-y-4 flex-grow">
                <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-muted-foreground">To:</label>
                    <input
                        type="email"
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full mt-1 p-2 bg-background border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground">Subject:</label>
                    <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full mt-1 p-2 bg-background border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="body" className="block text-sm font-medium text-muted-foreground">Body:</label>
                    <textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        className="w-full mt-1 p-2 bg-background border rounded-md"
                        required
                    />
                </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                    Cancel
                </button>
                <button type="submit" disabled={isSending} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-32 justify-center">
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </form>
    );
}