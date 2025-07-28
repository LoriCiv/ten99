// src/components/ClientForm.tsx

"use client";

import { useState, useEffect } from 'react';
import type { Client, Differential } from '@/types/app-interfaces';
import { Save, Loader2, Plus, Trash2, Copy } from 'lucide-react'; // Added Copy icon
import { v4 as uuidv4 } from 'uuid';

interface ClientFormProps {
  formType: 'company' | 'contact';
  initialData?: Partial<Client>;
  onSave: (data: Partial<Client>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  statusMessage: string | null;
  onDuplicate?: () => void; // This prop is for the duplicate button
}

export default function ClientForm({
  formType,
  initialData = {},
  onSave,
  onCancel,
  isSubmitting,
  statusMessage,
  onDuplicate // ✅ 1. Correctly receive the onDuplicate prop
}: ClientFormProps) {
  
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    // This effect ensures the form data updates if the initialData prop changes
    setFormData({
      clientType: formType === 'company' ? 'business_1099' : 'individual',
      status: 'Active',
      ...initialData,
    });
  }, [initialData, formType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDifferentialChange = (index: number, field: keyof Differential, value: string | number) => {
    const newDifferentials = [...(formData.differentials || [])];
    (newDifferentials[index] as any)[field] = field === 'amount' ? Number(value) : value;
    setFormData(prev => ({ ...prev, differentials: newDifferentials }));
  };
  
  const addDifferential = () => {
    const newDifferential: Differential = { id: uuidv4(), description: '', amount: 0 };
    setFormData(prev => ({ ...prev, differentials: [...(prev.differentials || []), newDifferential] }));
  };
  
  const removeDifferential = (index: number) => {
    const newDifferentials = [...(formData.differentials || [])];
    newDifferentials.splice(index, 1);
    setFormData(prev => ({ ...prev, differentials: newDifferentials }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border">
        <h2 className="text-2xl font-bold text-foreground">
            {formType === 'company' ? 'Company Details' : 'Contact Details'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formType === 'company' ? (
                <>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Company Name*</label>
                        <input name="companyName" value={formData.companyName || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Primary Contact Name*</label>
                        <input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium">Contact Name*</label>
                        <input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Company (Optional)</label>
                        <input name="companyName" value={formData.companyName || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                </>
            )}
            
            <div><label className="block text-sm font-medium">Primary Contact Title</label><input name="jobTitle" value={formData.jobTitle || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
            <div><label className="block text-sm font-medium">Contact Email</label><input name="email" type="email" value={formData.email || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
            <div><label className="block text-sm font-medium">Billing Email</label><input name="billingEmail" type="email" value={formData.billingEmail || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
        </div>

        {formType === 'company' && (
            <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Standard Rate ($/hr)</label><input name="rate" type="number" step="0.01" value={formData.rate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                    <div><label className="block text-sm font-medium">Payment Frequency</label><select name="payFrequency" value={formData.payFrequency || 'per_job'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md"><option value="per_job">Per Job</option><option value="weekly">Weekly</option><option value="biweekly">Bi-Weekly</option><option value="monthly">Monthly</option></select></div>
                    <div><label className="block text-sm font-medium">Payment Method</label><select name="paymentMethod" value={formData.paymentMethod || 'check'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md"><option value="check">Check</option><option value="direct_deposit">Direct Deposit</option><option value="virtual">Virtual (Venmo, etc.)</option><option value="cash">Cash</option><option value="other">Other</option></select></div>
                    <div><label className="block text-sm font-medium">Bank Statement Name</label><input name="bankPostedName" value={formData.bankPostedName || ''} onChange={handleInputChange} placeholder="How it appears on statements" className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                </div>
            </div>
        )}

        {formType === 'company' && (
            <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-foreground mb-2">Rate Differentials</h3>
                <p className="text-sm text-muted-foreground mb-4">Add automatic line items for specific conditions (e.g., weekends, holidays).</p>
                <div className="space-y-3">
                    {(formData.differentials || []).map((diff, index) => (
                        <div key={diff.id} className="flex items-center gap-2 p-2 border rounded-md bg-background/50">
                            <input value={diff.description} onChange={e => handleDifferentialChange(index, 'description', e.target.value)} placeholder="Description (e.g., Weekend Rate)" className="flex-grow p-2 bg-background border rounded-md" />
                            <input value={diff.amount} onChange={e => handleDifferentialChange(index, 'amount', e.target.value)} type="number" step="0.01" placeholder="Amount" className="w-28 p-2 bg-background border rounded-md" />
                            <button type="button" onClick={() => removeDifferential(index)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addDifferential} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Plus size={16}/> Add Differential</button>
                </div>
            </div>
        )}

        {statusMessage && <p className="text-red-500 text-sm text-center">{statusMessage}</p>}

        <div className="flex justify-between items-center pt-4 border-t">
            <div>
                {/* ✅ 2. Add the Duplicate button, only visible when editing a company */}
                {onDuplicate && (
                    <button type="button" onClick={onDuplicate} className="flex items-center gap-2 bg-muted text-muted-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted/80">
                        <Copy size={16} />
                        Duplicate
                    </button>
                )}
            </div>
            <div className="flex gap-4">
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    </form>
  );
}