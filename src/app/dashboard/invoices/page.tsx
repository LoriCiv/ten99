// src/app/dashboard/invoices/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { getInvoices, getClients, getUserProfile } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';

const TEMP_USER_ID = "dev-user-1";

function InvoicesPageInternal() {
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const filter = searchParams.get('filter');

    useEffect(() => {
        const unsubInvoices = getInvoices(TEMP_USER_ID, setInvoices);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubProfile = getUserProfile(TEMP_USER_ID, setUserProfile);

        // A simple way to handle initial load
        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            unsubInvoices();
            unsubClients();
            unsubProfile();
            clearTimeout(timer);
        };
    }, []);

    const filteredInvoices = useMemo(() => {
        if (!filter) return invoices;
        return invoices.filter(inv => inv.status === filter);
    }, [invoices, filter]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>;
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

                <div className="space-y-3">
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map(invoice => {
                            const client = clients.find(c => c.id === invoice.clientId);
                            return (
                                <div key={invoice.id} onClick={() => setSelectedInvoice(invoice)} className="bg-card p-4 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-muted">
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
                />
            )}
        </>
    );
}

export default function InvoicesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <InvoicesPageInternal />
        </Suspense>
    );
}