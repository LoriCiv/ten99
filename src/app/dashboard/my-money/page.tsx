// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Expense, Client, UserProfile, Certification, CEU } from '@/types/app-interfaces';
import { 
    getInvoices, getExpenses, getClients, getUserProfile, 
    updateUserProfile, getCertifications, getAllCEUs, addExpense
} from '@/utils/firestoreService';
import Link from 'next/link';
import { DollarSign, FileText, Landmark, Save, Loader2, ArrowRight, Award, Zap } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';
import ExpenseForm from '@/components/ExpenseForm';
import ExpensePieChart from '@/components/ExpensePieChart';

const TEMP_USER_ID = "dev-user-1";

const newExpenseInitialData = {};

const StatCard = ({ title, value, icon: Icon, note, theme = 'primary' }: { title: string; value: string; icon: React.ElementType; note?: string; theme?: 'primary' | 'green' | 'red' | 'yellow' }) => {
    const themes = {
        primary: 'bg-primary/10 text-primary',
        green: 'bg-emerald-500/10 text-emerald-600',
        red: 'bg-rose-500/10 text-rose-600',
        yellow: 'bg-amber-500/10 text-amber-600'
    };
    return (
        <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center">
                <div className={`p-2 rounded-full ${themes[theme]} mr-3`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
            {note && <p className="text-xs text-muted-foreground mt-2">{note}</p>}
        </div>
    );
};

export default function MyMoneyPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [allCeus, setAllCeus] = useState<CEU[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmittingTax, setIsSubmittingTax] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [stateRate, setStateRate] = useState<number | ''>('');
    const [manualYtdExpenses, setManualYtdExpenses] = useState<number | ''>('');

    useEffect(() => {
        const unsubscribers = [
            getInvoices(TEMP_USER_ID, setInvoices),
            getExpenses(TEMP_USER_ID, setExpenses),
            getClients(TEMP_USER_ID, setClients),
            getCertifications(TEMP_USER_ID, setCertifications),
            getAllCEUs(TEMP_USER_ID, setAllCeus),
            getUserProfile(TEMP_USER_ID, (profile) => {
                setUserProfile(profile);
                if (profile) setStateRate(profile.estimatedStateTaxRate || '');
                setIsLoading(false);
            })
        ];
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const ytdIncome = invoices.filter(inv => inv.status === 'paid' && new Date(inv.invoiceDate).getFullYear() === currentYear).reduce((sum, inv) => sum + (inv.total || 0), 0);
        const ytdCredentialCosts = certifications.filter(cert => cert.renewalCost && cert.issueDate && new Date(cert.issueDate).getFullYear() === currentYear).reduce((sum, cert) => sum + (cert.renewalCost || 0), 0) + allCeus.filter(ceu => ceu.cost && new Date(ceu.dateCompleted).getFullYear() === currentYear).reduce((sum, ceu) => sum + (ceu.cost || 0), 0);
        const ytdManualExpenses = expenses.filter(exp => new Date(exp.date).getFullYear() === currentYear).reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const totalYtdExpenses = ytdManualExpenses + ytdCredentialCosts;
        return { ytdIncome, ytdExpenses: totalYtdExpenses, ytdCredentialCosts, netIncome: ytdIncome - totalYtdExpenses };
    }, [invoices, expenses, certifications, allCeus]);
    
    const taxStats = useMemo(() => {
        const ytdIncome = stats.ytdIncome || 0;
        const totalExpenses = Number(manualYtdExpenses) || stats.ytdExpenses || 0;
        const selfEmploymentTaxRate = 0.153;
        const standardDeduction = 14600;
        const netEarningsFromSE = ytdIncome * 0.9235;
        const selfEmploymentTax = netEarningsFromSE * selfEmploymentTaxRate;
        const adjustedGrossIncome = ytdIncome - totalExpenses;
        const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);
        let federalTax = 0;
        if (taxableIncome > 47150) { federalTax = (taxableIncome - 47150) * 0.22 + 5184; } 
        else if (taxableIncome > 11600) { federalTax = (taxableIncome - 11600) * 0.12 + 1160; } 
        else { federalTax = taxableIncome * 0.10; }
        const stateTax = taxableIncome * ((Number(stateRate) || 0) / 100);
        const totalTaxOwed = selfEmploymentTax + federalTax + stateTax;
        return { totalTaxOwed };
    }, [stats.ytdIncome, stats.ytdExpenses, stateRate, manualYtdExpenses]);
        
    const handleSaveTaxSettings = async () => {
        setIsSubmittingTax(true);
        try {
            await updateUserProfile(TEMP_USER_ID, { estimatedStateTaxRate: Number(stateRate) });
            alert("Tax settings saved!");
        } catch (error) {
            console.error("Failed to save tax settings:", error);
            alert("Error saving tax settings.");
        } finally {
            setIsSubmittingTax(false);
        }
    };

    const handleAddExpense = async (data: Partial<Expense>) => {
        setIsSubmittingExpense(true);
        try {
            await addExpense(TEMP_USER_ID, data);
            alert("Expense added successfully!");
        } catch (error) {
            console.error("Failed to add expense:", error);
            alert("Failed to add expense.");
        } finally {
            setIsSubmittingExpense(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Financials...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-foreground">My Money</h1>
                    <p className="text-muted-foreground">Your financial command center.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="YTD Income (Paid)" value={`$${(stats.ytdIncome || 0).toFixed(2)}`} icon={DollarSign} theme="green" />
                    <StatCard title="YTD Expenses" value={`$${(stats.ytdExpenses || 0).toFixed(2)}`} icon={FileText} theme="red" />
                    <StatCard title="Credential Costs" value={`$${(stats.ytdCredentialCosts || 0).toFixed(2)}`} icon={Award} theme="yellow" />
                    <StatCard title="Net Income" value={`$${(stats.netIncome || 0).toFixed(2)}`} icon={Landmark} theme="primary" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <ExpenseForm 
                            userId={TEMP_USER_ID} 
                            onSave={handleAddExpense} 
                            onCancel={() => {}} 
                            clients={clients}
                            isSubmitting={isSubmittingExpense}
                            userProfile={userProfile}
                            initialData={newExpenseInitialData}
                        />
                        <div className="bg-card p-6 rounded-lg border">
                            <h3 className="text-lg font-semibold">Estimated Tax Liability</h3>
                             <div className="text-right my-4">
                                 <p className="text-sm text-muted-foreground">Total Owed (YTD)</p>
                                 <p className="text-3xl font-bold text-primary">${(taxStats.totalTaxOwed || 0).toFixed(2)}</p>
                             </div>
                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium">Override Expenses (for estimation)</label>
                                     <input type="number" value={manualYtdExpenses} onChange={(e) => setManualYtdExpenses(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder={`Auto-calculated: $${stats.ytdExpenses.toFixed(2)}`} />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium">Your State Tax Rate (%)</label>
                                     <input type="number" value={stateRate} onChange={(e) => setStateRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., 5" />
                                 </div>
                                 <button onClick={handleSaveTaxSettings} disabled={isSubmittingTax} className="w-full bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/80 disabled:opacity-50">
                                     {isSubmittingTax ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                     {isSubmittingTax ? 'Saving...' : 'Save Tax Settings'}
                                 </button>
                             </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card p-6 rounded-lg border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Recent Invoices</h3>
                                <Link href="/dashboard/invoices" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View All <ArrowRight size={14} /></Link>
                            </div>
                            <div className="space-y-3">
                                {invoices.slice(0, 5).map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    return (
                                        <div key={invoice.id} onClick={() => setSelectedInvoice(invoice)} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted cursor-pointer">
                                            <p>#{invoice.invoiceNumber} - {client?.name}</p>
                                            <p className="font-medium">${(invoice.total || 0).toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-lg border">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Expense Breakdown</h3>
                                <Link href="/dashboard/expenses" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View All <ArrowRight size={14} /></Link>
                             </div>
                             <div className="w-full h-[300px]">
                                <ExpensePieChart expenses={expenses} />
                             </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary/20 to-card p-6 rounded-lg border border-primary/30">
                             <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Zap size={20} className="text-primary"/> 
                                        Introducing Ten Sum
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">Go beyond tracking. Start planning.</p>
                                </div>
                                <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded-full">COMING SOON</span>
                             </div>
                             <p className="text-sm mb-4">
                                A new financial planning app designed for freelancers. Connect your Ten99 data to plan for sick days, get AI alerts on late payments, and automate your savings goals.
                             </p>
                             <button disabled className="w-full bg-primary/50 text-primary-foreground font-semibold py-2 px-4 rounded-lg cursor-not-allowed">
                                Learn More
                             </button>
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