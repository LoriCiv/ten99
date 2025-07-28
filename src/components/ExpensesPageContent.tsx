// src/components/ExpensesPageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import type { Expense, Client, UserProfile } from '@/types/app-interfaces';
import { getExpenses, getClients, getUserProfile, addExpense, updateExpense, deleteExpense } from '@/utils/firestoreService';
import { PlusCircle, Loader2, ThumbsUp, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import ExpenseModal from './ExpenseModal';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook

// ✅ New component for confirmation dialogs
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md border p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground my-4">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-muted text-muted-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted/80">Cancel</button>
                <button onClick={onConfirm} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90">Confirm</button>
            </div>
        </div>
    </div>
);

export default function ExpensesPageContent({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | undefined>(undefined);
    
    // ✅ State for our new status messages and confirmation dialogs
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ Expenses page is authenticated, fetching data...");
            const unsubExpenses = getExpenses(userId, (data) => {
                setAllExpenses(data);
                setIsLoading(false); // Stop loading once the main data is here
            });
            const unsubClients = getClients(userId, setClients);
            const unsubProfile = getUserProfile(userId, setUserProfile);

            return () => {
                unsubExpenses();
                unsubClients();
                unsubProfile();
            };
        }
    }, [isFirebaseAuthenticated, userId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

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
                await updateExpense(userId, selectedExpense.id, data);
                showStatusMessage("success", "Expense updated successfully!");
            } else {
                await addExpense(userId, data);
                showStatusMessage("success", "Expense added successfully!");
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save expense:", error);
            showStatusMessage("error", "Failed to save expense.");
        }
    };
    
    const handleDeleteExpense = async (expenseId: string) => {
        setConfirmation({
            title: "Delete Expense?",
            message: "Are you sure you want to delete this expense? This action cannot be undone.",
            onConfirm: async () => {
                try {
                    await deleteExpense(userId, expenseId);
                    showStatusMessage("success", "Expense deleted.");
                    handleCloseModal(); // Close modal if deleting from there
                } catch (error) {
                    console.error("Failed to delete expense:", error);
                    showStatusMessage("error", "Failed to delete expense.");
                }
                setConfirmation(null);
            }
        });
    };

    // ✅ 4. Show a loading indicator until Firebase is ready AND data is loaded
    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Expenses...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching your data...</p>
               </div>
           </div>
        );
    }

    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="p-1 rounded-full hover:bg-black/10"><X size={16}/></button>
                </div>
            )}

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
                                        {client && <p className="text-xs text-primary">{client.name || client.companyName}</p>}
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
                    onDelete={handleDeleteExpense} // Pass delete handler to modal
                    expense={selectedExpense}
                    userId={userId}
                    clients={clients}
                    userProfile={userProfile}
                />
            )}
        </>
    );
}