// src/components/ComposeMessageForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ComposeMessageFormProps {
    onSend: (to: string, subject: string, body: string) => Promise<boolean>;
    onClose: () => void;
    initialRecipient?: string;
    // ✅ 1. Add the new props to accept a subject and body
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
    const [to, setTo] = useState(initialRecipient);
    // ✅ 2. Use the new props to set the initial state
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // This ensures the form updates if a new initial state is passed
        setTo(initialRecipient);
        setSubject(initialSubject);
        setBody(initialBody);
    }, [initialRecipient, initialSubject, initialBody]);

    const handleSend = async () => {
        if (!to || !subject) {
            alert('A recipient and subject are required.');
            return;
        }
        setIsSending(true);
        const success = await onSend(to, subject, body);
        if (!success) {
            setIsSending(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">New Message</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">To:</label>
                    <input 
                        type="email" 
                        placeholder="recipient@example.com" 
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Subject:</label>
                    <input 
                        type="text" 
                        placeholder="Message subject" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Message:</label>
                    <textarea 
                        className="w-full h-60 mt-1 p-2 border rounded-md bg-background"
                        placeholder="Type your message here..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    ></textarea>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3">
                <button 
                    type="button"
                    onClick={onClose} 
                    className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    <Send size={16} />
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
}