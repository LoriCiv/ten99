// src/components/InvoiceForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface InvoiceFormProps {
    onSave: (data: Partial<Invoice>) => Promise<void>;
    onCancel: () => void;
    clients: Client[];
    initialData?: Partial<Invoice>;
    isSubmitting: boolean;
    userProfile: UserProfile | null;
    // ✅ THE FIX: The 'nextInvoiceNumber' prop is no longer required.
}

export default function InvoiceForm({ onSave, onCancel, clients, initialData, isSubmitting, userProfile }: InvoiceFormProps) {
    const isEditMode = !!initialData?.id;
    const [formData, setFormData] = useState<Partial<Invoice>>({
        status: 'draft',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ...initialData,
    });
    const [lineItems, setLineItems] = useState<LineItem[]>(initialData?.lineItems || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({...prev, ...initialData}));
            setLineItems(initialData.lineItems || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
        }
    }, [initialData])

    useEffect(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
        const tax = formData.tax || 0;
        const total = subtotal + tax;
        setFormData(prev => ({ ...prev, subtotal, total }));
    }, [lineItems, formData.tax]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };
    
    const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const updatedItems = [...lineItems];
        const item = { ...updatedItems[index] };

        if (field === 'description') {
            item[field] = String(value);
        } else if (field === 'quantity' || field === 'unitPrice' || field === 'total') {
            item[field] = Number(value) || 0;
        }

        if (field === 'quantity' || field === 'unitPrice') {
            item.total = (item.quantity || 0) * (item.unitPrice || 0);
        }
        
        updatedItems[index] = item;
        setLineItems(updatedItems);
    };

    const addLineItem = () => { setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]); };
    const removeLineItem = (index: number) => { if (lineItems.length > 1) { const updatedItems = [...lineItems]; updatedItems.splice(index, 1); setLineItems(updatedItems); } };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId || !formData.dueDate) { alert("Client and Due Date are required."); return; }
        await onSave({ ...formData, lineItems });
    };
    
    const clientName = formData.clientId ? (clients.find(c => c.id === formData.clientId)?.companyName || clients.find(c => c.id === formData.clientId)?.name) : '';

    return (
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg border">
            <div className="flex justify-between items-start mb-6 pb-6 border-b">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.professionalTitle || 'Your Name'}</h2>
                    <p className="text-sm text-muted-foreground">your.email@ten99.app</p>
                    {userProfile?.address && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.address}</p>}
                    {userProfile?.phone && <p className="text-sm text-muted-foreground">{userProfile.phone}</p>}
                </div>
                <div className="text-right">
                    <h3 className="text-3xl font-bold text-muted-foreground">INVOICE</h3>
                    <p className="text-sm"># {isEditMode ? formData.invoiceNumber : 'Will be generated on save'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-muted-foreground">BILL TO*</label>
                        {(isEditMode || initialData?.clientId) ? (
                            <p className="w-full mt-1 p-2 font-medium">{clientName}</p>
                        ) : (
                            <select name="clientId" value={formData.clientId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background text-base" required>
                                <option value="">-- Select a Client --</option>
                                {clients.map(c => <option key={c.id} value={c.id!}>{c.companyName || c.name}</option>)}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground">STATUS</label>
                        <select name="status" value={formData.status || 'draft'} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="void">Void</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground">INVOICE DATE</label>
                        <input type="date" name="invoiceDate" value={formData.invoiceDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground">DUE DATE*</label>
                        <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background" required />
                    </div>
                </div>

                <div className="space-y-2 pt-6 border-t">
                     <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-muted-foreground px-2 mb-2">
                         <div className="col-span-6">DESCRIPTION</div>
                         <div className="col-span-2 text-center">HOURS/QTY</div>
                         <div className="col-span-2 text-right">RATE/PRICE</div>
                         <div className="col-span-2 text-right">AMOUNT</div>
                    </div>
                    {lineItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-6"><textarea rows={3} placeholder="Service, product, or expense" value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} className="w-full p-2 border rounded-md bg-background" /></div>
                            <div className="col-span-2"><input type="number" step="0.01" placeholder="1" value={item.quantity} onChange={e => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-background text-center" /></div>
                            <div className="col-span-2"><input type="number" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={e => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-background text-right" /></div>
                            <div className="col-span-2 text-right font-medium p-2">${item.total.toFixed(2)}</div>
                            <div className="col-span-12 flex justify-end -mt-2"><button type="button" onClick={() => removeLineItem(index)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14}/></button></div>
                        </div>
                    ))}
                    <button type="button" onClick={addLineItem} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline pt-2"><PlusCircle size={16}/> Add Item / Expense</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                      <div>
                          <label className="block text-sm font-medium text-muted-foreground">Additional Notes</label>
                          <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 border rounded-md bg-background" placeholder="Add a personal thank you or note..."></textarea>
                          <div className="mt-4">
                              <h4 className="font-semibold text-sm text-muted-foreground">Default Terms & Conditions</h4>
                              <p className="text-xs text-muted-foreground whitespace-pre-line mt-1 p-2 bg-background/50 rounded-md">{userProfile?.defaultInvoiceNotes || 'Set your default terms in Settings > My Profile'}</p>
                          </div>
                           <div className="mt-4">
                              <h4 className="font-semibold text-sm text-muted-foreground">Default Payment Details</h4>
                              <p className="text-xs text-muted-foreground whitespace-pre-line mt-1 p-2 bg-background/50 rounded-md">{userProfile?.defaultPaymentDetails || 'Set your payment details in Settings > My Profile'}</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal</span> <span>${(formData.subtotal || 0).toFixed(2)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-muted-foreground">Tax</span> <input type="number" step="0.01" name="tax" value={formData.tax ?? ''} onChange={handleInputChange} className="w-24 p-1 border rounded-md bg-background text-right" placeholder="$0.00" /></div>
                          <div className="flex justify-between items-center font-bold text-lg pt-2 border-t"><span className="text-foreground">Amount Due</span> <span className="text-foreground">${(formData.total || 0).toFixed(2)}</span></div>
                      </div>
                </div>

                <div className="flex justify-end items-center mt-8 pt-6 border-t border-border">
                    <div className="flex space-x-3">
                        <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSubmitting ? 'Saving...' : 'Save Invoice'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}