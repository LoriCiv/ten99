"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { getInvoices, getClients, getUserProfile } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle, ArrowUpDown } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';
import { format } from 'date-fns';

const getStatusStyles = (status: Invoice['status']) => {
    switch (status) {
        case 'paid':
            return { borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-500/5', textColor: 'text-emerald-600' };
        case 'overdue':
            return { borderColor: 'border-l-rose-500', bgColor: 'bg-rose-500/5', textColor: 'text-rose-600' };
        case 'sent':
            return { borderColor: 'border-l-sky-500', bgColor: 'bg-sky-500/5', textColor: 'text-sky-600' };
        case 'void':
        case 'draft':
        default:
            return { borderColor: 'border-l-slate-400', bgColor: 'bg-slate-500/5', textColor: 'text-slate-500' };
    }
};

const SortButton = ({ active, direction, onClick, children }: { active: boolean, direction: string, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
        {children}
        {active && <ArrowUpDown size={14} className={`transition-transform ${direction === 'descending' ? 'rotate-180' : ''}`} />}
    </button>
);

interface InvoicesPageContentProps {
    userId: string;
}

function InvoicesPageInternal({ userId }: InvoicesPageContentProps) {
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'ascending' | 'descending' }>({ key: 'invoiceDate', direction: 'descending' });

    const initialFilter = searchParams.get('filter');

    useEffect(() => {
        if (initialFilter) {
            setStatusFilter(initialFilter);
        }
        const unsubInvoices = getInvoices(userId, setInvoices);
        const unsubClients = getClients(userId, setClients);
        const unsubProfile = getUserProfile(userId, (profile) => {
            setUserProfile(profile);
            setIsLoading(false);
        });

        return () => {
            unsubInvoices();
            unsubClients();
            unsubProfile();
        };
    }, [initialFilter, userId]);

    const processedInvoices = useMemo(() => {
        return invoices
            .filter(inv => statusFilter === 'all' || inv.status === statusFilter)
            .filter(inv => clientFilter === 'all' || inv.clientId === clientFilter)
            .sort((a, b) => {
                const aValue = a[sortConfig.key] || 0;
                const bValue = b[sortConfig.key] || 0;
                let comparison = 0;
                if (aValue > bValue) {
                    comparison = 1;
                } else if (aValue < bValue) {
                    comparison = -1;
                }
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
    }, [invoices, statusFilter, clientFilter, sortConfig]);
    
    const handleSort = (key: keyof Invoice) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                        <p className="text-muted-foreground mt-1">Track your billing and get paid.</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Link href="/dashboard/invoices/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <PlusCircle size={20} /> New Invoice
                        </Link>
                    </div>
                </header>

                <div className="bg-card border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-sm font-medium text-muted-foreground">Filter by Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-background">
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="void">Void</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-sm font-medium text-muted-foreground">Filter by Client</label>
                        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-background">
                            <option value="all">All Clients</option>
                            {clients.map(client => <option key={client.id} value={client.id!}>{client.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground self-center">Sort by:</span>
                        <SortButton active={sortConfig.key === 'invoiceDate'} direction={sortConfig.direction} onClick={() => handleSort('invoiceDate')}>Date</SortButton>
                        <SortButton active={sortConfig.key === 'status'} direction={sortConfig.direction} onClick={() => handleSort('status')}>Status</SortButton>
                        <SortButton active={sortConfig.key === 'total'} direction={sortConfig.direction} onClick={() => handleSort('total')}>Amount</SortButton>
                    </div>
                </div>

                <div className="space-y-3">
                    {processedInvoices.length > 0 ? (
                        processedInvoices.map(invoice => {
                            const client = clients.find(c => c.id === invoice.clientId);
                            const { borderColor, bgColor, textColor } = getStatusStyles(invoice.status);
                            return (
                                <div
                                    key={invoice.id}
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className={`bg-card p-4 rounded-lg border border-l-4 ${borderColor} ${bgColor} flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow`}
                                >
                                    <div>
                                        <p className="font-bold">#{invoice.invoiceNumber} - {client?.name || 'N/A'}</p>
                                        <p className="text-sm text-muted-foreground">Invoice Date: {format(new Date(invoice.invoiceDate + 'T00:00:00'), 'MMM d, yyyy')}</p>
                                        <p className="text-sm text-muted-foreground">Due: {format(new Date(invoice.dueDate + 'T00:00:00'), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${(invoice.total || 0).toFixed(2)}</p>
                                        <p className={`text-sm font-semibold capitalize ${textColor}`}>{invoice.status}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg">
                            <p className="font-semibold">No Invoices Found</p>
                            <p className="text-sm">Try adjusting your filters.</p>
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
                    userId={userId}
                />
            )}
        </>
    );
}

export default function InvoicesPageContent({ userId }: InvoicesPageContentProps) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>}>
            <InvoicesPageInternal userId={userId} />
        </Suspense>
    );
}