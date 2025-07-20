// src/components/TemplateFormModal.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Template } from '@/types/app-interfaces';
import { Save, Loader2 } from 'lucide-react';

interface TemplateFormModalProps {
    onSave: (data: Partial<Template>) => Promise<void>;
    onCancel: () => void;
    initialData: Partial<Template>;
    isSubmitting: boolean;
}

export default function TemplateFormModal({ onSave, onCancel, initialData, isSubmitting }: TemplateFormModalProps) {
    const [formData, setFormData] = useState<Partial<Template>>(initialData);
    const isEditMode = !!initialData?.id;

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Template' : 'New Template'}</h2>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Template Name*</label>
                    <input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Email Subject*</label>
                    <input name="subject" value={formData.subject || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Template Type</label>
                     <select name="type" value={formData.type || 'general'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                        <option value="general">General</option>
                        <option value="decline">Decline</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Body*</label>
                    <textarea name="body" value={formData.body || ''} onChange={handleInputChange} rows={6} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />}
                    {isSubmitting ? 'Saving...' : 'Save Template'}
                </button>
            </div>
        </form>
    );
}