// src/components/ExpenseModal.tsx
"use client";

import { useState } from 'react';
import type { Expense, Client } from '@/types/app-interfaces';
import { addExpense, updateExpense } from '@/utils/firestoreService';
import { Loader2, X } from 'lucide-react';
import ExpenseForm from './ExpenseForm';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    expense?: Partial<Expense>;
    userId: string;
    clients: Client[];
}

export default function ExpenseModal({ isOpen, onClose, onSave, expense, userId, clients }: ExpenseModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSaveAndClose = async (data: Partial<Expense>) => {
        setIsSubmitting(true);
        try {
            if (expense?.id) {
                await updateExpense(userId, expense.id, data);
            } else {
                await addExpense(userId, data);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save expense:", error);
            alert("Failed to save expense.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <div className="p-6">
                    <ExpenseForm
                        userId={userId}
                        clients={clients}
                        initialData={expense}
                        onSave={handleSaveAndClose}
                        // ✅ THE FIX: Added the required onCancel prop
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}