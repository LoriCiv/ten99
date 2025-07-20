// src/components/InvoiceDetailModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Invoice, Client, Appointment, UserProfile } from '@/types/app-interfaces';
import { updateInvoice, deleteInvoice, createInvoiceFromAppointment } from '@/utils/firestoreService';
import { X, Edit, Trash2, Send, CheckCircle, Loader2 } from 'lucide-react';
import InvoiceForm from './InvoiceForm';

const TEMP_USER_ID = "dev-user-1";

interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    clients: Client[];
    appointments: Appointment[];
    userProfile: UserProfile | null;
    onClose: () => void;
    onSave: () => void;
    invoices: Invoice[];
}

const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

export default function InvoiceDetailModal({ invoice, clients, appointments, userProfile, onClose, onSave, invoices }: InvoiceDetailModalProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsEditing(false);
    }, [invoice]);

    if (!invoice) return null;

    const client = clients.find(c => c.id === invoice.clientId);

    const handleUpdate = async (data: Partial<Invoice>) => {
        if (!invoice.id) return;
        setIsSubmitting(true);
        try {
            await updateInvoice(TEMP_USER_ID, invoice.id, data);
            alert("Invoice updated!");
            onSave();
            onClose();
        } catch (error) {
            console.error("Error updating invoice:", error);
            alert("Failed to update invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!invoice.id) return;
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            try {
                await deleteInvoice(TEMP_USER_ID, invoice.id);
                alert("Invoice deleted.");
                onSave();
                onClose();
            } catch (error) {
                console.error("Error deleting invoice:", error);
                alert("Failed to delete invoice.");
            }
        }
    };

    const handleMarkAsPaid = async () => {
        if (!invoice.id) return;
        if (window.confirm("Are you sure you want to mark this invoice as paid?")) {
             try {
                await updateInvoice(TEMP_USER_ID, invoice.id, { 
                    status: 'paid',
                    paymentDate: new Date().toISOString().split('T')[0] 
                });
                alert("Invoice marked as paid!");
                onSave();
                onClose();
            } catch (error) {
                console.error("Error marking as paid:", error);
                alert("Failed to mark as paid.");
            }
        }
    };
    
    const handleSendInvoice = async () => {
        if (!invoice || !client || !userProfile) {
            alert("Missing required data to send invoice.");
            return;
        }

        const recipientEmail = client.billingEmail || client.email;
        if (!recipientEmail) {
            alert("The selected client does not have an email address on file.");
            return;
        }

        if (!window.confirm(`Send this invoice to ${recipientEmail}?`)) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice, client, user: userProfile })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to send email.");
            }

            await updateInvoice(TEMP_USER_ID, invoice.id!, { status: 'sent' });

            alert("Invoice sent successfully!");
            onSave();
            onClose();

        } catch (error) {
            console.error("Error sending invoice:", error);
            alert(`Failed to send invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendReceipt = async () => {
        if (!invoice || !client || !userProfile) return alert("Missing data.");
        const recipientEmail = client.billingEmail || client.email;
        if (!recipientEmail) return alert("Client has no email address.");
        if (!window.confirm(`Send a paid receipt to ${recipientEmail}?`)) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/send-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice, client, user: userProfile })
            });
            if (!response.ok) throw new Error("Failed to send receipt.");
            alert("Receipt sent successfully!");
        } catch (error) {
            alert("Failed to send receipt.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border">
                {isEditing ? (
                    <div className="p-4 sm:p-6 lg:p-8">
                        <InvoiceForm
                            initialData={invoice}
                            onSave={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            clients={clients}
                            appointments={appointments}
                            isSubmitting={isSubmitting}
                            userProfile={userProfile}
                            nextInvoiceNumber={invoice.invoiceNumber}
                        />
                    </div>
                ) : (
                    <div>
                        <div className="p-6 sm:p-8">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b">
                               <div>
                                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.professionalTitle || 'Your Name'}</h2>
                                    <p className="text-sm text-muted-foreground">your.email@ten99.app</p>
                                    {userProfile?.address && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.address}</p>}
                                    {userProfile?.phone && <p className="text-sm text-muted-foreground">{userProfile.phone}</p>}
                                </div>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-muted-foreground">INVOICE</h3>
                                    <p className="text-sm"># {invoice.invoiceNumber}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-muted-foreground">BILL TO</p>
                                    <p className="font-medium">{client?.companyName || client?.name}</p>
                                </div>
                                <div className="space-y-1 text-left md:text-right">
                                    <p className="text-sm font-semibold text-muted-foreground">INVOICE DATE</p>
                                    <p>{invoice.invoiceDate}</p>
                                </div>
                                 <div className="space-y-1 text-left md:text-right">
                                    <p className="text-sm font-semibold text-muted-foreground">DUE DATE</p>
                                    <p>{invoice.dueDate}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t">
                                <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-muted-foreground px-2 mb-2">
                                    <div className="col-span-6">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">QTY/HOURS</div>
                                    <div className="col-span-2 text-right">RATE</div>
                                    <div className="col-span-2 text-right">AMOUNT</div>
                                </div>
                                {invoice.lineItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 py-2 border-b">
                                        <div className="col-span-6 whitespace-pre-line text-sm">{item.description}</div>
                                        <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                                        <div className="col-span-2 text-right text-sm">${item.unitPrice.toFixed(2)}</div>
                                        <div className="col-span-2 text-right font-medium text-sm">${item.total.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4">
                                <div className="w-full max-w-sm space-y-2 text-right">
                                    <p className="flex justify-between"><span>Subtotal:</span> <span>${(invoice.subtotal || 0).toFixed(2)}</span></p>
                                    <p className="flex justify-between"><span>Tax:</span> <span>${(invoice.tax || 0).toFixed(2)}</span></p>
                                    <p className="flex justify-between font-bold text-lg text-foreground"><span>Amount Due:</span> <span>${(invoice.total || 0).toFixed(2)}</span></p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 flex justify-between items-center bg-background/50 border-t">
                             <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
                             <div className="flex gap-2 flex-wrap justify-end">
                                {invoice.status === 'paid' && (
                                    <button onClick={handleSendReceipt} disabled={isSubmitting} className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                        {isSubmitting ? 'Sending...' : 'Send Receipt'}
                                    </button>
                                )}
                                {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                    <button onClick={handleSendInvoice} disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                        {isSubmitting ? 'Sending...' : (invoice.status === 'draft' ? 'Send Invoice' : 'Resend Invoice')}
                                    </button>
                                )}
                                {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'draft') && (
                                    <button onClick={handleMarkAsPaid} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"><CheckCircle size={16}/>Mark as Paid</button>
                                )}
                                <button onClick={handleDelete} className="flex items-center gap-2 bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/80"><Trash2 size={16}/>Delete</button>
                                
                                {/* ✅ THE FIX: The "Edit" button now appears for 'draft' OR 'sent' invoices */}
                                {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90"><Edit size={16}/>Edit</button>
                                )}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}