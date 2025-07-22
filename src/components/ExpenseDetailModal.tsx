// src/components/ExpenseDetailModal.tsx
"use client";

import type { Expense, Client } from '@/types/app-interfaces';
import { X, Edit, Trash2, Paperclip, Building, Tag, Calendar } from 'lucide-react';

interface ExpenseDetailModalProps {
    expense: Expense;
    clients: Client[];
    onClose: () => void;
    onEdit: (expense: Expense) => void;
    onDelete: (expenseId: string) => void;
}

export default function ExpenseDetailModal({ expense, clients, onClose, onEdit, onDelete }: ExpenseDetailModalProps) {
    const client = clients.find(c => c.id === expense.clientId);

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg border">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-foreground">{expense.description}</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
                    </div>
                    <p className="text-3xl font-bold text-rose-500 mt-2">${(expense.amount || 0).toFixed(2)}</p>
                </div>

                <div className="px-6 pb-6 space-y-3 border-t pt-4">
                    <div className="flex items-center text-sm"><Calendar size={16} className="mr-3 text-primary"/>Date: <span className="font-semibold text-foreground ml-2">{expense.date}</span></div>
                    <div className="flex items-center text-sm"><Tag size={16} className="mr-3 text-primary"/>Category: <span className="font-semibold text-foreground ml-2 capitalize">{expense.category.replace('_', ' ')}</span></div>
                    {client && <div className="flex items-center text-sm"><Building size={16} className="mr-3 text-primary"/>Client: <span className="font-semibold text-foreground ml-2">{client.companyName || client.name}</span></div>}
                    {expense.receiptUrl && 
                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-500 hover:underline">
                            <Paperclip size={16} className="mr-3"/> View Attached Receipt
                        </a>
                    }
                </div>

                {expense.notes && (
                    <div className="px-6 pb-6">
                        <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                        <p className="text-muted-foreground text-sm p-3 bg-background rounded-md whitespace-pre-wrap">{expense.notes}</p>
                    </div>
                )}

                <div className="p-6 flex justify-end gap-2 bg-background/50 border-t">
                    <button onClick={() => onDelete(expense.id!)} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Trash2 size={16}/>Delete</button>
                    <button onClick={() => onEdit(expense)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Edit size={16}/>Edit</button>
                </div>
            </div>
        </div>
    );
}