// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Expense, Client, UserProfile, Appointment } from '@/types/app-interfaces';
import { getInvoices, getExpenses, getClients, getUserProfile, getAppointments } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, Landmark, Hourglass, CheckCircle, AlertCircle, DollarSign, FileText } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';

const TEMP_USER_ID = "dev-user-1";

function StatCard({ title, value, icon: Icon, note }: { title: string; value: string; icon: React.ElementType; note?: string }) {
    return (
        <div className="bg-card p-6 rounded-lg border h-full transition-shadow hover:shadow-md">
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
            {note && <p className="text-xs text-muted-foreground mt-2">{note}</p>}
        </div>
    );
}

export default function MyMoneyPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        const today = new Date();
        const ytdIncome = invoices
            .filter(inv => inv.status === 'paid' && new Date(inv.invoiceDate).getFullYear() === today.getFullYear())
            .reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const outstandingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
        const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const overdueInvoices = outstandingInvoices.filter(inv => new Date(inv.dueDate) < today);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const ytdExpenses = expenses
            .filter(exp => new Date(exp.date).getFullYear() === today.getFullYear())
            .reduce((sum, exp) => sum + exp.amount, 0);

        return {
            ytdIncome: ytdIncome.toFixed(2),
            ytdExpenses: ytdExpenses.toFixed(2),
            netIncome: (ytdIncome - ytdExpenses).toFixed(2),
            outstanding: outstandingAmount.toFixed(2),
            overdueAmount: overdueAmount.toFixed(2),
            overdueCount: overdueInvoices.length,
        };
    }, [invoices, expenses]);

    const handleOpenInvoiceModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };
    
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Financials...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">My Money</h1>
                     <div className="flex gap-2">
                        <Link href="/dashboard/invoices/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <PlusCircle size={20} /> New Invoice
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="YTD Income (Paid)" value={`$${stats.ytdIncome}`} icon={DollarSign} />
                    <StatCard title="YTD Expenses" value={`$${stats.ytdExpenses}`} icon={FileText} />
                    <StatCard title="Net Income" value={`$${stats.netIncome}`} icon={Landmark} />
                    <Link href="/dashboard/invoices?filter=overdue" className="block hover:opacity-80">
                        <StatCard 
                            title="Overdue" 
                            value={`$${stats.overdueAmount}`} 
                            icon={AlertCircle}
                            note={`${stats.overdueCount} invoices are past due`}
                        />
                    </Link>
                </div>
                
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
                    {activeTab === 'expenses' && (
                         <div className="space-y-3">
                            {expenses.map(expense => (
                                <div key={expense.id} className="bg-card p-4 rounded-lg border flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{expense.description}</p>
                                        <p className="text-sm text-muted-foreground">{expense.date} - <span className="capitalize">{expense.category.replace('_', ' ')}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-500">${expense.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    clients={clients}
                    userProfile={userProfile}
                    onClose={() => setSelectedInvoice(null)}
                    onSave={() => setSelectedInvoice(null)}
                />
            )}
        </>
    );
}
