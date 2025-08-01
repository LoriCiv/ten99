"use client";

import { useState, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';

interface ComposeMessageFormProps {
    onSend: (recipients: string[], subject: string, body: string) => Promise<boolean>;
    onClose: () => void;
    initialData?: { recipient?: string; recipients?: string[]; subject:string; body: string; };
    isSending: boolean;
}

// --- TEMPORARY DEBUG VERSION ---
export default function ComposeMessageForm({ onSend, onClose, isSending }: ComposeMessageFormProps) {
    
    // This function now bypasses ALL validation and sends a hardcoded message.
    const handleForceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('--- DEBUG: Forcing send with test data ---');
        onSend(['test@example.com'], 'DEBUG-SUBJECT', 'This is a debug message.');
    };

    return (
        <form onSubmit={handleForceSubmit} className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Compose (Debug Mode)</h3>
                <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20}/></button>
            </div>
            <div className="p-4 space-y-4">
                <p className="text-muted-foreground">Form is in debug mode. Input fields are disabled.</p>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">To:</label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background/50 min-h-[42px] mt-1">
                       <input placeholder="test@example.com" className="flex-grow bg-transparent outline-none p-1" disabled />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject:</label>
                    <input value="DEBUG-SUBJECT" className="w-full mt-1 p-2 bg-background/50 border rounded-md" disabled />
                </div>
            </div>
            <div className="p-4 flex-grow">
                <textarea placeholder="This is a debug message." className="w-full h-full p-2 bg-background/50 border rounded-md resize-none" disabled />
            </div>
            <div className="p-4 border-t flex justify-end">
                <button type="submit" disabled={isSending} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                    {isSending ? 'Sending...' : 'FORCE SEND'}
                </button>
            </div>
        </form>
    );
}