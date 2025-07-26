"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Expense, Client, UserProfile } from '@/types/app-interfaces';
import { getExpenses, getClients, getUserProfile, addExpense, updateExpense, deleteExpense } from '@/utils/firestoreService';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ExpenseModal from './ExpenseModal'; // We'll reuse the modal with the form

interface ExpensesPageContentProps {
    userId: string;
}

export default function ExpensesPageContent({ userId }: ExpensesPageContentProps) {
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | undefined>(undefined);

    useEffect(() => {
        const unsubExpenses = getExpenses(userId, (data) => {
            setAllExpenses(data);
            setIsLoading(false);
        });
        const unsubClients = getClients(userId, setClients);
        const unsubProfile = getUserProfile(userId, setUserProfile);

        return () => {
            unsubExpenses();
            unsubClients();
            unsubProfile();
        };
    }, [userId]);

    const handleOpenModal = (expense?: Expense) => {
        setSelectedExpense(expense || {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedExpense(undefined);
    };

    const handleSaveExpense = async (data: Partial<Expense>) => {
        try {
            if (selectedExpense?.id) {
                // Update existing expense
                await updateExpense(userId, selectedExpense.id, data);
                alert("Expense updated successfully!");
            } else {
                // Add new expense
                await addExpense(userId, data);
                alert("Expense added successfully!");
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save expense:", error);
            alert("Failed to save expense.");
        }
    };
    
    const handleDeleteExpense = async (expenseId: string) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await deleteExpense(userId, expenseId);
                alert("Expense deleted.");
                handleCloseModal();
            } catch (error) {
                console.error("Failed to delete expense:", error);
                alert("Failed to delete expense.");
            }
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Expenses...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
                        <p className="text-muted-foreground mt-1">Track and manage all your business expenses.</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <PlusCircle size={20} /> New Expense
                        </button>
                    </div>
                </header>
                
                <div className="bg-card border rounded-lg">
                    <div className="hidden md:grid md:grid-cols-5 gap-4 p-4 border-b text-sm font-semibold text-muted-foreground">
                        <span>Date</span>
                        <span className="col-span-2">Description</span>
                        <span>Category</span>
                        <span className="text-right">Amount</span>
                    </div>
                    <div className="divide-y">
                        {allExpenses.map(expense => {
                            const client = clients.find(c => c.id === expense.clientId);
                            return (
                                <div key={expense.id} onClick={() => handleOpenModal(expense)} className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 cursor-pointer hover:bg-muted">
                                    <div className="font-medium text-foreground">{format(new Date(expense.date + 'T00:00:00'), 'MMM d, yyyy')}</div>
                                    <div className="col-span-2">
                                        <p className="font-semibold text-foreground">{expense.description}</p>
                                        {client && <p className="text-xs text-primary">{client.name}</p>}
                                    </div>
                                    <div className="text-muted-foreground">{expense.category}</div>
                                    <div className="font-mono text-right text-foreground col-start-2 md:col-start-auto">${(Number(expense.amount) || 0).toFixed(2)}</div>
                                </div>
                            );
                        })}
                        {allExpenses.length === 0 && (
                            <p className="p-8 text-center text-muted-foreground">You haven't logged any expenses yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ExpenseModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveExpense}
                    expense={selectedExpense}
                    userId={userId}
                    clients={clients}
                    userProfile={userProfile}
                />
            )}
        </>
    );
}