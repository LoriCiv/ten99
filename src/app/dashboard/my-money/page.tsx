// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Expense, Client, UserProfile, Appointment } from '@/types/app-interfaces';
// ✅ FIX 1: Added 'getAppointments' to the import list
import { getInvoices, getExpenses, getClients, getUserProfile, getAppointments } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, DollarSign, FileText } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';

const TEMP_USER_ID = "dev-user-1";

// ... (The StatCard component is correct)

export default function MyMoneyPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    useEffect(() => {
        const unsubInvoices = getInvoices(TEMP_USER_ID, setInvoices);
        const unsubExpenses = getExpenses(TEMP_USER_ID, setExpenses);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubAppointments = getAppointments(TEMP_USER_ID, setAppointments);
        const unsubProfile = getUserProfile(TEMP_USER_ID, (profile) => {
            setUserProfile(profile);
            setIsLoading(false);
        });
        return () => {
            unsubInvoices();
            unsubExpenses();
            unsubClients();
            unsubAppointments();
            unsubProfile();
        };
    }, []);

    const stats = useMemo(() => {
        // ... (stats calculation logic is correct)
    }, [invoices, expenses]);

    const handleOpenInvoiceModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsInvoiceModalOpen(true);
    };
    
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Financials...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                {/* ... (The header and StatCard grid are correct) ... */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">My Money</h1>
                    <div className="flex gap-2">
                        <Link href="/dashboard/invoices/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <PlusCircle size={20} /> New Invoice
                        </Link>
                    </div>
                </header>
                
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('invoices')} className={`${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Invoices</button>
                        <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Expenses</button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'invoices' && (
                        <div className="space-y-3">
                            {invoices.map(invoice => {
                                const client = clients.find(c => c.id === invoice.clientId);
                                return (
                                    <div key={invoice.id} onClick={() => handleOpenInvoiceModal(invoice)} className="bg-card p-4 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-muted">
                                        <div>
                                            <p className="font-bold">#{invoice.invoiceNumber} - {client?.name || 'N/A'}</p>
                                            <p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${invoice.total.toFixed(2)}</p>
                                            <p className="text-sm capitalize">{invoice.status}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {activeTab === 'expenses' && <p>Expenses view coming soon.</p>}
                </div>

            </div>

            {isInvoiceModalOpen && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    clients={clients}
                    userProfile={userProfile}
                    // ✅ FIX 2: We are no longer passing the unnecessary 'appointments' prop here.
                    onClose={() => setIsInvoiceModalOpen(false)}
                    onSave={() => setIsInvoiceModalOpen(false)}
                />
            )}
        </>
    );
}