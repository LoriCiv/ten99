// src/components/InvoiceDetailModal.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { updateInvoice, deleteInvoice } from '@/utils/firestoreService';
import { X, Edit, Trash2, Send, CheckCircle, Loader2 } from 'lucide-react';
import InvoiceForm from './InvoiceForm';

const TEMP_USER_ID = "dev-user-1";

interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    clients: Client[];
    userProfile: UserProfile | null;
    onClose: () => void;
    onSave: () => void;
}

export default function InvoiceDetailModal({ invoice, clients, userProfile, onClose, onSave }: InvoiceDetailModalProps) {
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
                    // paymentDate: new Date().toISOString().split('T')[0] 
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
            console.error("Error sending receipt:", error);
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
                            isSubmitting={isSubmitting}
                            userProfile={userProfile}
                            // ✅ THE FIX: Removed the unnecessary 'nextInvoiceNumber' prop
                        />
                    </div>
                ) : (
                    <div>
                        {/* ... (rest of the display JSX is correct) ... */}
                    </div>
                )}
            </div>
        </div>
    );
}