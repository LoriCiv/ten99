// src/components/CertificationForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Certification } from '@/types/app-interfaces';
import { Save, Loader2 } from 'lucide-react';

interface CertificationFormProps {
    onSave: (data: Partial<Certification>) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<Certification>;
    isSubmitting: boolean;
}

export default function CertificationForm({ onSave, onCancel, initialData, isSubmitting }: CertificationFormProps) {
    const [formData, setFormData] = useState<Partial<Certification>>({
        name: '',
        issuingOrganization: '',
        type: 'certification',
        issueDate: '',
        expirationDate: '',
        credentialId: '',
        credentialUrl: '',
        totalCeusRequired: 0,
        renewalCost: 0,
        specialtyCeusCategory: '',
        specialtyCeusRequired: 0,
        specialtyCeusCategory2: '',
        specialtyCeusRequired2: 0,
        notes: '',
        ...initialData
    });
    
    const isEditMode = !!initialData?.id;

    useEffect(() => {
        setFormData({ type: 'certification', ...initialData });
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.issuingOrganization) {
            alert("Name and Issuing Organization are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Credential' : 'New Credential'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-muted-foreground">Type*</label><select name="type" value={formData.type || 'certification'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required><option value="certification">Certification</option><option value="license">License</option><option value="membership">Membership</option></select></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Name*</label><input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground">Issuing Organization / Body*</label><input name="issuingOrganization" value={formData.issuingOrganization || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Issue Date</label><input type="date" name="issueDate" value={formData.issueDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Expiration / Renewal Date</label><input type="date" name="expirationDate" value={formData.expirationDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Credential ID / Number</label><input name="credentialId" value={formData.credentialId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Credential URL (e.g., Credly)</label><input type="url" name="credentialUrl" value={formData.credentialUrl || ''} onChange={handleInputChange} placeholder="https://..." className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground">Renewal Cost ($)</label><input type="number" step="0.01" name="renewalCost" value={formData.renewalCost ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
            </div>

            {formData.type === 'certification' && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">CEU Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-muted-foreground">Total CEUs Required</label><input type="number" step="0.1" name="totalCeusRequired" value={formData.totalCeusRequired ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                        <div></div> {/* Spacer */}
                        <div><label className="block text-sm font-medium text-muted-foreground">Specialty Category 1 Name</label><input name="specialtyCeusCategory" value={formData.specialtyCeusCategory || ''} onChange={handleInputChange} placeholder="e.g., Professional Studies" className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground">CEUs Required for Cat. 1</label><input type="number" step="0.1" name="specialtyCeusRequired" value={formData.specialtyCeusRequired ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground">Specialty Category 2 Name</label><input name="specialtyCeusCategory2" value={formData.specialtyCeusCategory2 || ''} onChange={handleInputChange} placeholder="e.g., PPO" className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                        <div><label className="block text-sm font-medium text-muted-foreground">CEUs Required for Cat. 2</label><input type="number" step="0.1" name="specialtyCeusRequired2" value={formData.specialtyCeusRequired2 ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                    </div>
                </div>
            )}

            <div className="md:col-span-2 pt-4 border-t"><label className="block text-sm font-medium text-muted-foreground">Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea></div>
            
            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-32 justify-center">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
}