"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Expense, Client, UserProfile, Certification, CEU, Appointment, Mileage } from '@/types/app-interfaces';
import {
    getInvoices, getExpenses, getClients, getUserProfile,
    updateUserProfile, getCertifications, getAllCEUs, addExpense, getAppointments,
    getMileage
} from '@/utils/firestoreService';
import Link from 'next/link';
import {
    DollarSign, FileText, Landmark, Save, Loader2, ArrowRight, Award, Zap, Info,
    BarChart3, CalendarClock, PieChart, FileDown, MonitorSmartphone, Car
} from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';
import ExpenseForm from '@/components/ExpenseForm';
import ExpensePieChart from '@/components/ExpensePieChart';
import FinancialTrendsModal from '@/components/FinancialTrendsModal';
import MileageFormModal from './MileageFormModal';
import Modal from './Modal';
import { getMonth, getYear, format, subMonths, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

const IRS_MILEAGE_RATE = 0.67; // For 2024 tax year

type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
type TrendData = { month: string; Income: number; Expenses: number; };

const StatCard = ({ title, value, icon: Icon, note, theme = 'primary', onClick }: { title: string; value: string; icon: React.ElementType; note?: string; theme?: 'primary' | 'green' | 'red' | 'yellow', onClick?: () => void }) => {
    const themes = {
        primary: 'bg-primary/10 text-primary',
        green: 'bg-emerald-500/10 text-emerald-600',
        red: 'bg-rose-500/10 text-rose-600',
        yellow: 'bg-amber-500/10 text-amber-600'
    };
    const isClickable = !!onClick;
    return (
        <div onClick={onClick} className={`bg-card p-4 rounded-lg border flex flex-col justify-center ${isClickable ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}>
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

const ReportButton = ({ title, description, icon: Icon, onClick }: { title: string, description: string, icon: React.ElementType, onClick?: () => void }) => (
    <button onClick={onClick} className="bg-card p-4 rounded-lg border text-left hover:border-primary hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed" disabled={!onClick}>
        <div className="flex items-center gap-4">
            <div className="bg-secondary p-3 rounded-lg">
                <Icon className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
                <h4 className="font-semibold text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    </button>
);

interface MyMoneyPageContentProps {
    userId: string;
}

export default function MyMoneyPageContent({ userId }: MyMoneyPageContentProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [manualExpenses, setManualExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [allCeus, setAllCeus] = useState<CEU[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [mileageEntries, setMileageEntries] = useState<Mileage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmittingTax, setIsSubmittingTax] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
    const [trendsData, setTrendsData] = useState<TrendData[]>([]);
    const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);
    
    const [stateRate, setStateRate] = useState<number | ''>('');
    const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
    const [dependents, setDependents] = useState<number | ''>(0);

    useEffect(() => {
        const unsubscribers = [
            getInvoices(userId, setInvoices),
            getExpenses(userId, setManualExpenses),
            getClients(userId, setClients),
            getCertifications(userId, setCertifications),
            getAllCEUs(userId, setAllCeus),
            getAppointments(userId, setAppointments),
            getMileage(userId, setMileageEntries),
            getUserProfile(userId, (profile) => {
                setUserProfile(profile);
                if (profile) {
                    setStateRate(profile.estimatedStateTaxRate || '');
                }
                setIsLoading(false);
            })
        ];
        return () => unsubscribers.forEach(unsub => unsub());
    }, [userId]);

    const allExpenses = useMemo(() => {
        const certExpenses: Expense[] = (certifications || []).filter(cert => cert.renewalCost && cert.renewalCost > 0).map(cert => ({ id: `cert-${cert.id}`, description: `Renewal for ${cert.name}`, amount: cert.renewalCost!, date: cert.issueDate || new Date().toISOString().split('T')[0], category: 'Professional Development', isReadOnly: true, }));
        const ceuExpenses: Expense[] = (allCeus || []).filter(ceu => ceu.cost && ceu.cost > 0).map(ceu => ({ id: `ceu-${ceu.id}`, description: `CEU: ${ceu.activityName}`, amount: ceu.cost!, date: ceu.dateCompleted, category: 'Professional Development', isReadOnly: true, }));
        return [...manualExpenses, ...certExpenses, ...ceuExpenses];
    }, [manualExpenses, certifications, allCeus]);

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const ytdIncome = invoices.filter(inv => inv.status === 'paid' && getYear(new Date(inv.invoiceDate)) === currentYear).reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalMiles = mileageEntries.filter(m => getYear(new Date(m.date)) === currentYear).reduce((sum, entry) => sum + (entry.miles || 0), 0);
        const ytdMileageDeduction = totalMiles * IRS_MILEAGE_RATE;
        const ytdDirectExpenses = allExpenses.filter(exp => getYear(new Date(exp.date)) === currentYear).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const totalYtdExpenses = ytdDirectExpenses + ytdMileageDeduction;
        const netIncome = ytdIncome - totalYtdExpenses;
        return { ytdIncome, ytdExpenses: totalYtdExpenses, ytdMileageDeduction, netIncome, totalMiles };
    }, [invoices, allExpenses, mileageEntries]);
    
    const taxStats = useMemo(() => {
        const ytdIncome = stats.ytdIncome || 0;
        const totalExpenses = stats.ytdExpenses || 0;
        const standardDeductions: Record<FilingStatus, number> = { single: 14600, married_jointly: 29200, married_separately: 14600, head_of_household: 21900 };
        const federalBrackets: Record<FilingStatus, { rate: number; threshold: number; base: number }[]> = {
            single: [ { rate: 0.24, threshold: 94300, base: 15735 }, { rate: 0.22, threshold: 47150, base: 5426 }, { rate: 0.12, threshold: 11600, base: 1160 }, { rate: 0.10, threshold: 0, base: 0 } ],
            married_jointly: [ { rate: 0.24, threshold: 190750, base: 22439 }, { rate: 0.22, threshold: 94300, base: 10852 }, { rate: 0.12, threshold: 23200, base: 2320 }, { rate: 0.10, threshold: 0, base: 0 } ],
            married_separately: [ { rate: 0.24, threshold: 95375, base: 11219.5 }, { rate: 0.22, threshold: 47150, base: 5426 }, { rate: 0.12, threshold: 11600, base: 1160 }, { rate: 0.10, threshold: 0, base: 0 } ],
            head_of_household: [ { rate: 0.24, threshold: 95350, base: 11215 }, { rate: 0.22, threshold: 63000, base: 7278 }, { rate: 0.12, threshold: 16550, base: 1655 }, { rate: 0.10, threshold: 0, base: 0 } ],
        };
        const netProfit = ytdIncome - totalExpenses;
        if (netProfit <= 0) return { totalTaxOwed: 0, quarterlyPayment: 0 };
        const netEarningsFromSE = netProfit * 0.9235;
        const selfEmploymentTax = netEarningsFromSE * 0.153;
        const adjustedGrossIncome = netProfit - (selfEmploymentTax / 2);
        const standardDeduction = standardDeductions[filingStatus];
        const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);
        let federalTax = 0;
        const brackets = federalBrackets[filingStatus];
        for (const bracket of brackets) {
            if (taxableIncome > bracket.threshold) {
                federalTax = (taxableIncome - bracket.threshold) * bracket.rate + bracket.base;
                break;
            }
        }
        const stateTax = taxableIncome * ((Number(stateRate) || 0) / 100);
        const childTaxCredit = (Number(dependents) || 0) * 2000;
        const totalTaxOwed = Math.max(0, selfEmploymentTax + federalTax + stateTax - childTaxCredit);
        const quarterlyPayment = totalTaxOwed / 4;
        return { totalTaxOwed, quarterlyPayment };
    }, [stats.ytdIncome, stats.ytdExpenses, stateRate, filingStatus, dependents]);
    
    const handleSaveTaxSettings = async () => {
        setIsSubmittingTax(true);
        try {
            await updateUserProfile(userId, { estimatedStateTaxRate: Number(stateRate) });
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
            await addExpense(userId, data);
            alert("Expense added successfully!");
        } catch (error) {
            console.error("Failed to add expense:", error);
            alert("Failed to add expense.");
        } finally {
            setIsSubmittingExpense(false);
        }
    };
    
    const downloadTxtFile = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateFinancialTrends = () => {
        const currentYear = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => format(new Date(currentYear, i), 'MMM'));
        
        const monthlyData = months.map(month => ({ month, Income: 0, Expenses: 0 }));

        invoices.forEach(inv => {
            const invDate = new Date(inv.invoiceDate);
            if (inv.status === 'paid' && getYear(invDate) === currentYear) {
                monthlyData[getMonth(invDate)].Income += inv.total;
            }
        });

        allExpenses.forEach(exp => {
            const expDate = new Date(exp.date);
            if (getYear(expDate) === currentYear) {
                monthlyData[getMonth(expDate)].Expenses += Number(exp.amount) || 0;
            }
        });

        setTrendsData(monthlyData);
        setIsTrendsModalOpen(true);
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
                    <StatCard title="YTD Income (Paid)" value={`$${stats.ytdIncome.toFixed(2)}`} icon={DollarSign} theme="green" />
                    <StatCard title="YTD Expenses" value={`$${stats.ytdExpenses.toFixed(2)}`} icon={FileText} theme="red" note="Includes mileage"/>
                    <StatCard title="Net Income" value={`$${stats.netIncome.toFixed(2)}`} icon={Landmark} theme="primary" />
                    <StatCard title="YTD Mileage" value={`${stats.totalMiles.toFixed(1)} mi`} icon={Car} onClick={() => setIsMileageModalOpen(true)} note={`~ $${stats.ytdMileageDeduction.toFixed(2)} deduction`}/>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <ExpenseForm
                            userId={userId}
                            onSave={handleAddExpense}
                            onCancel={() => {}}
                            clients={clients}
                            isSubmitting={isSubmittingExpense}
                            userProfile={userProfile}
                            initialData={{}}
                        />
                        <div className="bg-card p-6 rounded-lg border">
                            <h3 className="text-lg font-semibold">Estimated Tax Liability</h3>
                            <div className="my-4 space-y-2">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Estimated Quarterly Payment</p>
                                    <p className="text-3xl font-bold text-primary">${taxStats.quarterlyPayment.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Owed (YTD)</p>
                                    <p className="text-lg font-semibold">${taxStats.totalTaxOwed.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <label htmlFor="filingStatus" className="block text-sm font-medium text-muted-foreground">Filing Status</label>
                                    <select id="filingStatus" value={filingStatus} onChange={(e) => setFilingStatus(e.target.value as FilingStatus)} className="w-full mt-1 p-2 bg-background border rounded-md">
                                        <option value="single">Single</option>
                                        <option value="married_jointly">Married Filing Jointly</option>
                                        <option value="head_of_household">Head of Household</option>
                                        <option value="married_separately">Married Filing Separately</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dependents" className="block text-sm font-medium text-muted-foreground">Number of Dependents</label>
                                    <input id="dependents" type="number" value={dependents} onChange={(e) => setDependents(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., 2" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="stateRate" className="block text-sm font-medium text-muted-foreground">Your State Income Tax Rate (%)</label>
                                        <a href="https://www.irs.gov/tax-professionals/government-sites" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline flex items-center gap-1"><Info size={12} />Look up rate</a>
                                    </div>
                                    <input id="stateRate" type="number" value={stateRate} onChange={(e) => setStateRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 bg-background border rounded-md" placeholder="e.g., 5" />
                                </div>
                                <button onClick={handleSaveTaxSettings} disabled={isSubmittingTax} className="w-full bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/80 disabled:opacity-50">
                                    {isSubmittingTax ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSubmittingTax ? 'Saving...' : 'Save Rate'}
                                </button>
                                <p className="text-xs text-muted-foreground text-center pt-2">This is a simplified estimate for informational purposes only. Consult a tax professional for advice.</p>
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
                                <ExpensePieChart expenses={allExpenses} />
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                           <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                        <Zap size={20}/>
                                        Introducing Ten Sum
                                    </h3>
                                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Go beyond tracking. Start planning.</p>
                                </div>
                                <span className="text-xs font-semibold bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-1 rounded-full">COMING SOON</span>
                           </div>
                           <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                A new financial planning app designed for freelancers. Connect your Ten99 data to plan for sick days, get AI alerts on late payments, and automate your savings goals.
                           </p>
                           <button disabled className="w-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-semibold py-2 px-4 rounded-lg cursor-not-allowed">
                                Learn More
                           </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 mt-8 border-t">
                    <header className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground">Run Financial Reports</h2>
                        <p className="text-muted-foreground">Generate summaries and totals for your records.</p>
                        <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded-md mt-2 flex items-center gap-2">
                            <MonitorSmartphone size={14} />
                            For the best experience, we recommend downloading reports on a desktop computer.
                        </p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ReportButton
                            title="Weekly Summaries"
                            description="View income, expenses, and hours on a week-by-week basis."
                            icon={CalendarClock}
                            onClick={()=>{alert("Coming Soon!")}}
                        />
                        <ReportButton
                            title="Financial Trends"
                            description="Visualize your income vs. expense trends over time."
                            icon={BarChart3}
                            onClick={handleGenerateFinancialTrends}
                        />
                        <ReportButton
                            title="Job Completion Stats"
                            description="Analyze your job volume, completion rates, and client breakdown."
                            icon={PieChart}
                            onClick={()=>{alert("Coming Soon!")}}
                        />
                        <ReportButton
                            title="Simple Year-End Totals"
                            description="A clean summary of total income and categorized expenses."
                            icon={FileText}
                            onClick={()=>{alert("Coming Soon!")}}
                        />
                        <ReportButton
                            title="Comprehensive Tax Package"
                            description="Generate and download a detailed report for your tax preparer."
                            icon={FileDown}
                            onClick={()=>{alert("Coming Soon!")}}
                        />
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
                    userId={userId}
                />
            )}
            
            <FinancialTrendsModal
                isOpen={isTrendsModalOpen}
                onClose={() => setIsTrendsModalOpen(false)}
                data={trendsData}
            />
            
            <Modal isOpen={isMileageModalOpen} onClose={() => setIsMileageModalOpen(false)} className="max-w-4xl">
                <MileageFormModal 
                    userId={userId} 
                    onClose={() => setIsMileageModalOpen(false)} 
                    initialMileage={mileageEntries}
                />
            </Modal>
        </>
    );
}