// src/components/ExpensesPageContent.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense, Client, UserProfile } from '@/types/app-interfaces';
import { 
    getExpenses, 
    getClients, 
    deleteExpense, 
    addExpense, 
    updateExpense, 
    getUserProfile 
} from '@/utils/firestoreService';
import { PlusCircle, Award } from 'lucide-react';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';

interface ExpensesPageContentProps {
    initialExpenses: Expense[];
    initialClients: Client[];
    initialProfile: UserProfile | null;
    userId: string;
}

export default function ExpensesPageContent({ initialExpenses, initialClients, initialProfile, userId }: ExpensesPageContentProps) {
    const router = useRouter();
    const [expenses, setExpenses] = useState(initialExpenses);
    const [clients] = useState(initialClients);
    const [userProfile, setUserProfile] = useState(initialProfile);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-desc');

    useEffect(() => {
        setExpenses(initialExpenses);
        // Set up a listener for real-time profile updates if needed
        const unsubProfile = getUserProfile(userId, setUserProfile);
        return () => unsubProfile();
    }, [userId, initialExpenses]);
    
    const filteredAndSortedExpenses = useMemo(() => {
        return [...expenses]
            .filter(expense => {
                const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
                const clientMatch = clientFilter === 'all' || !expense.isReadOnly && expense.clientId === clientFilter;
                return categoryMatch && clientMatch;
            })
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'amount-desc': return (b.amount || 0) - (a.amount || 0);
                    case 'amount-asc': return (a.amount || 0) - (b.amount || 0);
                    case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                    default: return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
    }, [expenses, categoryFilter, clientFilter, sortOrder]);

    const handleOpenFormModal = (expense?: Expense) => {
        if (expense?.isReadOnly) return;
        setSelectedExpense(expense || null);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedExpense(null);
    };

    const handleSave = async (data: Partial<Expense>) => {
        try {
            if (selectedExpense?.id && !selectedExpense.id.startsWith('cert-') && !selectedExpense.id.startsWith('ceu-')) {
                await updateExpense(userId, selectedExpense.id, data);
            } else {
                await addExpense(userId, data);
            }
            alert("Expense saved!");
            handleCloseFormModal();
            router.refresh();
        } catch (error) {
            console.error("Failed to save expense:", error);
            alert("Failed to save expense.");
        }
    };

    const handleDelete = async (expenseId: string) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await deleteExpense(userId, expenseId);
                alert("Expense deleted.");
                setSelectedExpense(null);
                router.refresh();
            } catch (error) {
                console.error("Failed to delete expense:", error);
                alert("Failed to delete expense.");
            }
        }
    };
    
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground">All Expenses</h1>
                    <button onClick={() => handleOpenFormModal()} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                        <PlusCircle size={20} /> Add Expense
                    </button>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg">
                    {/* ... Your full filter and sort controls JSX ... */}
                </div>

                <div className="bg-card p-4 rounded-lg border">
                    {/* ... Your full expense list mapping JSX ... */}
                </div>
            </div>

            {isFormModalOpen && (
                <ExpenseModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSave={handleSave}
                    expense={selectedExpense || undefined}
                    userId={userId}
                    clients={clients}
                    userProfile={userProfile}
                />
            )}

            {selectedExpense && !isFormModalOpen && (
                <ExpenseDetailModal
                    expense={selectedExpense}
                    clients={clients}
                    onClose={() => setSelectedExpense(null)}
                    onEdit={() => handleOpenFormModal(selectedExpense)}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
}