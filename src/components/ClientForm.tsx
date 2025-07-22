"use client";

import React, { useState, useEffect } from 'react';
import type { Client } from '@/types/app-interfaces';
// ✅ Make sure Copy icon is imported
import { Save, Copy, Loader2 } from 'lucide-react';

const FormLabel = ({ children }: { children: React.ReactNode }) => (<label className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (<input {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (<select {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (<textarea {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);

interface ClientFormProps {
    initialData?: Partial<Client>;
    onSave: (data: Partial<Client>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    onDuplicate?: () => void; // The prop for the duplicate handler
}

export default function ClientForm({ initialData, onSave, onCancel, isSubmitting, onDuplicate }: ClientFormProps) {
    const [formData, setFormData] = useState<Partial<Client>>({
        clientType: 'business_1099',
        status: 'Active',
        payFrequency: 'biweekly',
        ...initialData
    });

    const isEditMode = !!initialData?.id;

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Company' : 'New Company Details'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><FormLabel>Client Type</FormLabel><Select name="clientType" value={formData.clientType || 'business_1099'} onChange={handleInputChange}><option value="business_1099">Business (1099)</option><option value="individual_1099">Individual (1099)</option><option value="employer_w2">Employer (W2)</option></Select></div>
                 <div><FormLabel>Status</FormLabel><Select name="status" value={formData.status || 'Active'} onChange={handleInputChange}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Lead">Lead</option></Select></div>
                 <div className="md:col-span-2"><FormLabel>Company Name</FormLabel><Input name="companyName" value={formData.companyName || ''} onChange={handleInputChange} /></div>
                 <div><FormLabel>Primary Contact Name*</FormLabel><Input name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
                 <div><FormLabel>Contact Email</FormLabel><Input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></div>
                 <div><FormLabel>Billing Email</FormLabel><Input type="email" name="billingEmail" value={formData.billingEmail || ''} onChange={handleInputChange} /></div>
                 <div><FormLabel>Phone</FormLabel><Input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} /></div>
                 <div className="md:col-span-2"><FormLabel>Website</FormLabel><Input type="url" name="website" value={formData.website || ''} onChange={handleInputChange} /></div>
                 <div className="md:col-span-2"><FormLabel>Address</FormLabel><Textarea name="address" rows={3} value={formData.address || ''} onChange={handleInputChange} /></div>
            </div>
             <div className="pt-4 border-t border-border/50">
                 <h4 className="text-lg font-medium mb-2">Financials</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><FormLabel>{formData.clientType === 'employer_w2' ? 'W2 Base Rate ($)' : '1099 Hourly Rate ($)'}</FormLabel><Input type="number" step="0.01" name="rate" value={formData.rate ?? ''} onChange={handleInputChange} /></div>
                      {formData.clientType?.includes('1099') && (<div className="md:col-span-2"><FormLabel>Differential Rate Notes</FormLabel><Textarea name="differentials" value={formData.differentials || ''} onChange={handleInputChange} rows={2} placeholder="e.g., Nights: 1.5x"/></div>)}
                      {formData.clientType === 'employer_w2' && (<><div><FormLabel>Pay Frequency</FormLabel><Select name="payFrequency" value={formData.payFrequency || 'biweekly'} onChange={handleInputChange}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="semimonthly">Semi-monthly</option><option value="monthly">Monthly</option></Select></div><div><FormLabel>Federal Withholding ($)</FormLabel><Input type="number" step="0.01" name="federalWithholding" value={formData.federalWithholding ?? ''} onChange={handleInputChange} /></div><div><FormLabel>State Withholding ($)</FormLabel><Input type="number" step="0.01" name="stateWithholding" value={formData.stateWithholding ?? ''} onChange={handleInputChange} /></div></>)}
                 </div>
             </div>
             <div className="md:col-span-2"><FormLabel>General Notes</FormLabel><Textarea name="notes" rows={3} value={formData.notes || ''} onChange={handleInputChange} /></div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                {/* ✅ The Duplicate button, which only shows in edit mode */}
                {isEditMode && onDuplicate && (
                    <button type="button" onClick={onDuplicate} className="flex items-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 mr-auto">
                        <Copy size={16}/> Duplicate
                    </button>
                )}
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}