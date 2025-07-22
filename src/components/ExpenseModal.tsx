// src/components/ExpenseModal.tsx
"use client";

import type { Expense, Client } from '@/types/app-interfaces';
import { X } from 'lucide-react';
import ExpenseForm from './ExpenseForm';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Expense>) => Promise<void>; // Changed for compatibility
    expense?: Partial<Expense>;
    userId: string;
    clients: Client[];
}

export default function ExpenseModal({ isOpen, onClose, onSave, expense, userId, clients }: ExpenseModalProps) {

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border relative">
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
                        onSave={onSave}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}