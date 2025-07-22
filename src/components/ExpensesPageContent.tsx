// src/components/ExpensesPageContent.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense, Client } from '@/types/app-interfaces';
import { deleteExpense, addExpense, updateExpense } from '@/utils/firestoreService';
import { PlusCircle, Award } from 'lucide-react';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseDetailModal from '@/components/ExpenseDetailModal';

interface ExpensesPageContentProps {
    initialExpenses: Expense[];
    initialClients: Client[];
    userId: string;
}

export default function ExpensesPageContent({ initialExpenses, initialClients, userId }: ExpensesPageContentProps) {
    const router = useRouter();
    const [expenses, setExpenses] = useState(initialExpenses);
    const [clients] = useState(initialClients);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-desc');

    useEffect(() => {
        setExpenses(initialExpenses);
    }, [initialExpenses]);

    const filteredAndSortedExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
                const clientMatch = clientFilter === 'all' || expense.clientId === clientFilter;
                return categoryMatch && clientMatch;
            })
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'amount-desc':
                        return (b.amount || 0) - (a.amount || 0);
                    case 'amount-asc':
                        return (a.amount || 0) - (b.amount || 0);
                    case 'date-asc':
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case 'date-desc':
                    default:
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
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
            if (selectedExpense?.id) {
                await updateExpense(userId, selectedExpense.id, data);
                alert("Expense updated!");
            } else {
                await addExpense(userId, data);
                alert("Expense added!");
            }
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="categoryFilter" className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                            <select id="categoryFilter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background">
                                <option value="all">All Categories</option>
                                <option value="travel">Travel</option>
                                <option value="equipment">Equipment</option>
                                <option value="supplies">Supplies</option>
                                <option value="professional_development">Professional Development</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="clientFilter" className="block text-sm font-medium text-muted-foreground mb-1">Client</label>
                            <select id="clientFilter" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background">
                                <option value="all">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id!}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sortOrder" className="block text-sm font-medium text-muted-foreground mb-1">Sort By</label>
                            <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full p-2 border rounded-md bg-background">
                                <option value="date-desc">Date: Newest First</option>
                                <option value="date-asc">Date: Oldest First</option>
                                <option value="amount-desc">Amount: High to Low</option>
                                <option value="amount-asc">Amount: Low to High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-4 rounded-lg border">
                    <div className="space-y-2">
                        {filteredAndSortedExpenses.map(expense => (
                            <div key={expense.id} onClick={() => !expense.isReadOnly && setSelectedExpense(expense)} className={`grid grid-cols-4 gap-4 items-center p-3 rounded-md ${expense.isReadOnly ? 'bg-muted/50' : 'hover:bg-muted cursor-pointer'}`}>
                                <div>
                                    <p className="font-semibold flex items-center gap-2">
                                        {/* ✅ THE FIX IS HERE: Wrapped the icon in a span to apply the title tooltip */}
                                        {expense.isReadOnly && (
                                            <span title="Auto-generated from Credentials">
                                                <Award size={14} className="text-amber-500" />
                                            </span>
                                        )}
                                        {expense.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground pl-6">{expense.date}</p>
                                </div>
                                <p className="text-sm capitalize">{expense.category.replace(/_/g, ' ')}</p>
                                <p className="text-sm">{clients.find(c => c.id === expense.clientId)?.name || 'N/A'}</p>
                                <p className="text-right font-medium text-rose-600">-${(expense.amount || 0).toFixed(2)}</p>
                            </div>
                        ))}
                         {filteredAndSortedExpenses.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No expenses match your filters.</p>
                            </div>
                        )}
                    </div>
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