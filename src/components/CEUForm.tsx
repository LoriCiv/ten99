// src/components/CEUForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { CEU } from '@/types/app-interfaces';
import { Save, Loader2 } from 'lucide-react';

interface CEUFormProps {
    onSave: (data: Partial<CEU>) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<CEU>;
    isSubmitting: boolean;
    // ✅ 1. Add a prop to receive the available categories
    availableCategories: string[];
}

export default function CEUForm({ onSave, onCancel, initialData, isSubmitting, availableCategories }: CEUFormProps) {
    const [formData, setFormData] = useState<Partial<CEU>>({
        activityName: '',
        dateCompleted: '',
        ceuHours: 0,
        provider: '',
        cost: 0,
        category: 'General Studies', // Default category
        ...initialData
    });

    const isEditMode = !!initialData?.id;

    useEffect(() => {
        setFormData({ category: 'General Studies', ...initialData });
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.activityName || !formData.ceuHours) {
            alert("Activity Name and CEU Hours are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit CEU' : 'Log New CEU'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground">Activity Name*</label>
                    <input name="activityName" value={formData.activityName || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">CEU Hours*</label>
                    <input type="number" step="0.1" name="ceuHours" value={formData.ceuHours ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground">Date Completed</label>
                    <input type="date" name="dateCompleted" value={formData.dateCompleted || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground">Provider / Sponsor</label>
                    <input name="provider" value={formData.provider || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                </div>
                
                {/* ✅ 2. Add the Category and Cost fields */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Category</label>
                    <select name="category" value={formData.category || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Cost ($)</label>
                    <input type="number" step="0.01" name="cost" value={formData.cost ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-32 justify-center">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSubmitting ? 'Saving...' : 'Save CEU'}
                </button>
            </div>
        </form>
    );
}