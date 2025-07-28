// src/components/CEUForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { CEU } from '@/types/app-interfaces';
import { Save, Loader2, Info } from 'lucide-react'; // ✅ 1. Import an icon for the error message

interface CEUFormProps {
    onSave: (data: Partial<CEU>) => Promise<void>;
    onCancel: () => void;
    initialData: Partial<CEU>;
    isSubmitting: boolean;
    availableCategories: string[];
}

export default function CEUForm({ onSave, onCancel, initialData, isSubmitting, availableCategories }: CEUFormProps) {
    const isEditMode = !!initialData.id;
    const [formData, setFormData] = useState<Partial<CEU>>(initialData);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // ✅ 2. Add state for the error message

    useEffect(() => {
        const defaultData = { category: 'General Studies', ...initialData };
        setFormData(defaultData);
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null); // Clear previous errors

        // ✅ 3. Replace alert() with a state-based error message
        if (!formData.activityName || !formData.ceuHours) {
            setErrorMessage("Activity Name and CEU Hours are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit CEU' : 'Log New CEU'}</h2>
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">Activity Name*</label>
                <input name="activityName" value={formData.activityName || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Date Completed*</label>
                    <input name="dateCompleted" type="date" value={formData.dateCompleted || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">CEU Hours*</label>
                    <input name="ceuHours" type="number" step="0.1" value={formData.ceuHours ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-muted-foreground">Category</label>
                <select name="category" value={formData.category || 'General Studies'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                    {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-muted-foreground">Provider / Sponsor (Optional)</label>
                <input name="provider" value={formData.provider || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
            </div>

            <div>
                <label className="block text-sm font-medium text-muted-foreground">Website (Optional)</label>
                <input name="website" type="url" value={formData.website || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="https://example.com" />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-muted-foreground">Cost ($) (Optional)</label>
                <input name="cost" type="number" step="0.01" value={formData.cost ?? ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
            </div>

            {/* ✅ 4. Display the error message here if it exists */}
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <Info size={16} />
                    <span className="text-sm">{errorMessage}</span>
                </div>
            )}

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