"use client";

import { useState, useEffect } from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { updateInvoice, deleteInvoice } from '@/utils/firestoreService';
import { X, Edit, Trash2, Send, CheckCircle, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InvoiceForm from './InvoiceForm';
import Modal from './Modal';

// ✅ 1. Update the props to receive userId
interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    clients: Client[];
    userProfile: UserProfile | null;
    onClose: () => void;
    onSave: () => void;
    userId: string;
}

export default function InvoiceDetailModal({ invoice, clients, userProfile, onClose, onSave, userId }: InvoiceDetailModalProps) { // ✅ 2. Receive userId
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsEditing(false);
    }, [invoice]);

    const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

    const handleUpdate = async (data: Partial<Invoice>) => {
        if (!invoice?.id) return;
        setIsSubmitting(true);
        try {
            // ✅ 3. Use the real userId for all actions
            await updateInvoice(userId, invoice.id, data);
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
        if (!invoice?.id) return;
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            try {
                await deleteInvoice(userId, invoice.id);
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
        if (!invoice?.id) return;
        if (window.confirm("Are you sure you want to mark this invoice as paid?")) {
             try {
                await updateInvoice(userId, invoice.id, {
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

            await updateInvoice(userId, invoice.id!, { status: 'sent' });
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
        <Modal isOpen={!!invoice} onClose={onClose} className="max-w-4xl">
            {invoice && (
                isEditing ? (
                    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                        <InvoiceForm
                            initialData={invoice}
                            onSave={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            clients={clients}
                            isSubmitting={isSubmitting}
                            userProfile={userProfile}
                            nextInvoiceNumber={invoice.invoiceNumber}
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto relative">
                            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full z-10">
                                <X size={20} />
                            </button>
                            <div className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-6 pb-6 border-b pr-8">
                                    <div>
                                        <h2 className="text-2xl font-bold">{userProfile?.name || userProfile?.professionalTitle || 'Your Name'}</h2>
                                        <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
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
                                        <p className="text-sm font-semibold text-muted-foreground">BILLED TO</p>
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
                                    <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-semibold text-muted-foreground px-2 mb-2">
                                        <div className="col-span-6">DESCRIPTION</div>
                                        <div className="col-span-2 text-center">HOURS/QTY</div>
                                        <div className="col-span-2 text-right">RATE/PRICE</div>
                                        <div className="col-span-2 text-right">AMOUNT</div>
                                    </div>

                                    {invoice.lineItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-5 md:grid-cols-12 gap-2 py-3 border-b">
                                            <div className="col-span-3 md:col-span-6 text-sm">
                                                <p className="font-medium whitespace-pre-line">{item.description}</p>
                                                <p className="text-muted-foreground md:hidden">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                                            </div>
                                            <div className="hidden md:block col-span-2 text-center text-sm">{item.quantity}</div>
                                            <div className="hidden md:block col-span-2 text-right text-sm">${item.unitPrice.toFixed(2)}</div>
                                            <div className="col-span-2 text-right font-medium text-sm">${item.total.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                    <div className="w-full max-w-xs space-y-2 text-right">
                                        <p className="flex justify-between"><span>Subtotal:</span> <span>${(invoice.subtotal || 0).toFixed(2)}</span></p>
                                        <p className="flex justify-between"><span>Tax:</span> <span>${(invoice.tax || 0).toFixed(2)}</span></p>
                                        <p className="flex justify-between font-bold text-lg pt-2 border-t"><span>Amount Due:</span> <span>${(invoice.total || 0).toFixed(2)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 flex justify-end items-center gap-2 bg-muted/50 border-t sticky bottom-0">
                            {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'draft') && (
                                <Button onClick={handleMarkAsPaid} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                    <CheckCircle size={16}/>Mark as Paid
                                </Button>
                            )}
                            {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                <Button onClick={handleSendInvoice} disabled={isSubmitting} className="flex items-center gap-2">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                    {isSubmitting ? 'Sending...' : (invoice.status === 'draft' ? 'Send Invoice' : 'Resend Invoice')}
                                 </Button>
                            )}
                            {invoice.status === 'paid' && (
                                 <Button onClick={handleSendReceipt} disabled={isSubmitting} className="flex items-center gap-2">
                                     {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                     {isSubmitting ? 'Sending...' : 'Send Receipt'}
                                 </Button>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {(invoice.status === 'draft' || invoice.status === 'sent') && (
                                        <DropdownMenuItem onSelect={() => setIsEditing(true)} className="cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onSelect={handleDelete} className="cursor-pointer text-red-600 focus:text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </>
                )
            )}
        </Modal>
    );
}