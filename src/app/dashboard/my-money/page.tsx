// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Expense, Client, UserProfile } from '@/types/app-interfaces';
import { getInvoices, getExpenses, getClients, getUserProfile, updateUserProfile } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, Landmark, Hourglass, CheckCircle, AlertCircle, Save, Loader2, DollarSign, FileText } from 'lucide-react';
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
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ytdExpenses, setYtdExpenses] = useState<number | ''>('');
    const [stateRate, setStateRate] = useState<number | ''>('');

    useEffect(() => {
        const unsubInvoices = getInvoices(TEMP_USER_ID, setInvoices);
        const unsubExpenses = getExpenses(TEMP_USER_ID, setExpenses);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubProfile = getUserProfile(TEMP_USER_ID, (profile) => {
            setUserProfile(profile);
            if (profile) {
                setStateRate(profile.estimatedStateTaxRate || '');
            }
        });

        // A simple way to handle initial load and prevent getting stuck
        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            unsubInvoices();
            unsubExpenses();
            unsubClients();
            unsubProfile();
            clearTimeout(timer);
        };
    }, []);

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ytdIncome = invoices
            .filter(inv => inv.status === 'paid' && new Date(inv.invoiceDate).getFullYear() === currentYear)
            .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const outstandingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
        const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const overdueInvoices = outstandingInvoices.filter(inv => new Date(inv.dueDate) < today);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const totalCollected = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        const expensesValue = expenses
            .filter(exp => new Date(exp.date).getFullYear() === today.getFullYear())
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        const selfEmploymentTaxRate = 0.153;
        const standardDeduction = 14600;
        const netEarningsFromSE = ytdIncome * 0.9235;
        const selfEmploymentTax = netEarningsFromSE * selfEmploymentTaxRate;
        const adjustedGrossIncome = ytdIncome - expensesValue;
        const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);
        let federalTax = 0;
        if (taxableIncome > 47150) { federalTax = (taxableIncome - 47150) * 0.22 + 5184; } 
        else if (taxableIncome > 11600) { federalTax = (taxableIncome - 11600) * 0.12 + 1160; } 
        else { federalTax = taxableIncome * 0.10; }
        const stateTax = taxableIncome * ((Number(stateRate) || 0) / 100);
        const totalTaxOwed = selfEmploymentTax + federalTax + stateTax;

        return {
            ytdIncome: ytdIncome.toFixed(2),
            ytdExpenses: expensesValue.toFixed(2),
            netIncome: (ytdIncome - expensesValue).toFixed(2),
            outstanding: outstandingAmount.toFixed(2),
            overdueAmount: overdueAmount.toFixed(2),
            overdueCount: overdueInvoices.length,
            totalCollected: totalCollected.toFixed(2),
            totalTaxOwed: totalTaxOwed.toFixed(2),
            quarterlyPayment: (totalTaxOwed / 4).toFixed(2),
        };
    }, [invoices, expenses, ytdExpenses, stateRate]);

    const handleSaveStateRate = async () => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(TEMP_USER_ID, { estimatedStateTaxRate: Number(stateRate) });
            alert("State tax rate saved!");
        } catch (error) {
            console.error("Failed to save tax rate:", error);
            alert("Error saving tax rate.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

                <div className="mt-8 bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Estimated Tax Liability ({new Date().getFullYear()})</h2>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Owed (YTD)</p>
                            <p className="text-3xl font-bold text-primary">${stats.totalTaxOwed}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">This is a rough estimate for a single filer and is not tax advice.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium">Total Business Expenses (YTD)</label>
                            <input type="number" value={ytdExpenses} onChange={(e) => setYtdExpenses(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="$0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Your State Tax Rate (%)</label>
                            <input type="number" value={stateRate} onChange={(e) => setStateRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., 5" />
                        </div>
                        <button onClick={handleSaveStateRate} disabled={isSubmitting} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/80 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSubmitting ? 'Saving...' : 'Save Rate'}
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Suggested Quarterly Payment</p>
                                <p className="text-2xl font-bold">${stats.quarterlyPayment}</p>
                            </div>
                        </div>
                    </div>
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