// src/components/ExpenseModal.tsx
"use client";

import { useState } from 'react';
import type { Expense, Client, UserProfile } from '@/types/app-interfaces';
import { X } from 'lucide-react';
import ExpenseForm from './ExpenseForm';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Expense>) => Promise<void>;
    expense?: Partial<Expense>;
    userId: string;
    clients: Client[];
    userProfile: UserProfile | null; // ✅ Added userProfile to props
}

export default function ExpenseModal({ isOpen, onClose, onSave, expense, userId, clients, userProfile }: ExpenseModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    if (!isOpen) return null;

    const handleSave = async (data: Partial<Expense>) => {
        setIsSubmitting(true);
        await onSave(data);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                    <X size={20} />
                </button>
                <div className="p-6">
                    <ExpenseForm
                        userId={userId}
                        clients={clients}
                        initialData={expense}
                        onSave={handleSave}
                        onCancel={onClose}
                        isSubmitting={isSubmitting} 
                        userProfile={userProfile} // ✅ Passed userProfile down to the form
                    />
                </div>
            </div>
        </div>
    );
}