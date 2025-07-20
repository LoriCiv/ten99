// src/app/dashboard/invoices/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Invoice, Client, Appointment, UserProfile } from '@/types/app-interfaces';
import { getInvoices, getClients, getUserProfile, getAppointments } from '@/utils/firestoreService';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import InvoiceDetailModal from '@/components/InvoiceDetailModal'; // ✅ 1. Import the modal

const TEMP_USER_ID = "dev-user-1";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ 2. Add state to manage the modal
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    
    // ✅ 3. Handlers to open and close the modal
    const handleInvoiceClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>;
    }

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client?.companyName || client?.name || 'Unknown Client';
    };
    
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'draft': default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map(invoice => (
                            <div 
                                key={invoice.id} 
                                // ✅ 4. Make the invoice item clickable
                                onClick={() => handleInvoiceClick(invoice)} 
                                className="bg-card p-4 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-muted transition-colors"
                            >
                                <div>
                                    <p className="font-bold text-foreground">{invoice.invoiceNumber}</p>
                                    <p className="text-sm text-primary">{getClientName(invoice.clientId)}</p>
                                    <p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl">${(invoice.total || 0).toFixed(2)}</p>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                                        {invoice.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg">
                            <h3 className="text-lg font-semibold">No Invoices Yet</h3>
                            <p className="text-sm">Click "New Invoice" to create your first one.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* ✅ 5. Render the modal when an invoice is selected */}
            {isModalOpen && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    clients={clients}
                    appointments={appointments}
                    userProfile={userProfile}
                    onClose={handleCloseModal}
                    onSave={handleCloseModal}
                />
            )}
        </>
    );
}