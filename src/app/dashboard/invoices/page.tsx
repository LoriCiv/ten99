// src/app/dashboard/invoices/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Invoice, Client, Appointment, UserProfile } from '@/types/app-interfaces';
import { getInvoices, getClients, getUserProfile, getAppointments } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';

const TEMP_USER_ID = "dev-user-1";

function InvoicesPageInternal() {
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        const unsubInvoices = getInvoices(TEMP_USER_ID, (data) => {
            setInvoices(data);
            setIsLoading(false);
        });
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubAppointments = getAppointments(TEMP_USER_ID, setAppointments);
        const unsubProfile = getUserProfile(TEMP_USER_ID, setUserProfile);

        return () => {
            unsubInvoices();
            unsubClients();
            unsubAppointments();
            unsubProfile();
        };
    }, []);

    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'overdue') {
            setStatusFilter('overdue');
        }
    }, [searchParams]);

    const filteredInvoices = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return invoices.filter(invoice => {
            const statusMatch = statusFilter === 'all' || 
                (statusFilter === 'overdue' ? invoice.status !== 'paid' && new Date(invoice.dueDate) < today : invoice.status === statusFilter);
            const clientMatch = clientFilter === 'all' || invoice.clientId === clientFilter;
            const yearMatch = yearFilter === 'all' || new Date(invoice.invoiceDate).getFullYear().toString() === yearFilter;
            
            return statusMatch && clientMatch && yearMatch;
        });
    }, [invoices, statusFilter, clientFilter, yearFilter]);
    
    const uniqueYears = useMemo(() => {
        const years = new Set(invoices.map(inv => new Date(inv.invoiceDate).getFullYear().toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [invoices]);

    const handleInvoiceClick = (invoice: Invoice) => { setSelectedInvoice(invoice); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedInvoice(null); };

    if (isLoading) { return <div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>; }
    
    const getClientName = (clientId: string) => { const client = clients.find(c => c.id === clientId); return client?.companyName || client?.name || 'Unknown Client'; };
    const getInvoiceStyle = (status: string, dueDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (status !== 'paid' && new Date(dueDate) < today) {
            return { bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-400', textColor: 'text-red-700 dark:text-red-300' };
        }
        switch (status.toLowerCase()) {
            case 'paid': return { bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-400', textColor: 'text-green-700 dark:text-green-300' };
            case 'sent': return { bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-400', textColor: 'text-blue-700 dark:text-blue-300' };
            case 'draft': default: return { bgColor: 'bg-card', borderColor: 'border-border', textColor: 'text-muted-foreground' };
        }
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                    <Link href="/dashboard/invoices/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                        <PlusCircle size={20} /> New Invoice
                    </Link>
                </header>

                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card border rounded-lg">
                    <div className="flex-1 min-w-[150px]"><label className="block text-sm font-medium text-muted-foreground mb-1">Status</label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background"><option value="all">All Statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>
                    <div className="flex-1 min-w-[150px]"><label className="block text-sm font-medium text-muted-foreground mb-1">Client</label><select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background"><option value="all">All Clients</option>{clients.map(client => <option key={client.id} value={client.id!}>{client.companyName || client.name}</option>)}</select></div>
                    <div className="flex-1 min-w-[150px]"><label className="block text-sm font-medium text-muted-foreground mb-1">Year</label><select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background"><option value="all">All Years</option>{uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
                </div>

                <div className="space-y-4">
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map(invoice => {
                            const style = getInvoiceStyle(invoice.status, invoice.dueDate);
                            const today = new Date(); today.setHours(0,0,0,0);
                            const statusText = new Date(invoice.dueDate) < today && invoice.status !== 'paid' ? 'OVERDUE' : invoice.status.toUpperCase();
                            return (
                                <div key={invoice.id} onClick={() => handleInvoiceClick(invoice)} className={`p-4 rounded-lg border-l-4 flex justify-between items-center cursor-pointer transition-colors ${style.bgColor} ${style.borderColor}`}>
                                    <div>
                                        <p className="font-bold text-foreground">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-primary">{getClientName(invoice.clientId)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Date: {invoice.invoiceDate}</p>
                                        <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl">${(invoice.total || 0).toFixed(2)}</p>
                                        <p className={`text-sm font-bold mt-1 ${style.textColor}`}>{statusText}</p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg">
                            <h3 className="text-lg font-semibold">No Invoices Found</h3>
                            <p className="text-sm">Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && ( <InvoiceDetailModal invoice={selectedInvoice} clients={clients} appointments={appointments} userProfile={userProfile} onClose={handleCloseModal} onSave={handleCloseModal} invoices={invoices}/> )}
        </>
    );
}

export default function InvoicesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>}>
            <InvoicesPageInternal />
        </Suspense>
    );
}