// src/components/ContactForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { PersonalNetworkContact, Client } from '@/types/app-interfaces';
import { Save, Copy } from 'lucide-react';

const FormLabel = ({ children }: { children: React.ReactNode }) => (<label className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (<input {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (<select {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (<textarea {...props} className="w-full mt-1 p-2 bg-background border rounded-md" />);

interface ContactFormProps {
    initialData?: Partial<PersonalNetworkContact>;
    onSave: (data: Partial<PersonalNetworkContact>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    clients: Client[];
    onDuplicate?: () => void; // ✅ 1. Add the new prop
}

export default function ContactForm({ initialData, onSave, onCancel, isSubmitting, clients, onDuplicate }: ContactFormProps) {
    const [formData, setFormData] = useState<Partial<PersonalNetworkContact>>(initialData || {});
    const isEditMode = !!initialData?.id;

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-lg border space-y-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{isEditMode ? 'Edit Contact' : 'New Contact Details'}</h2>

            <div className="space-y-4">
                <div><FormLabel>Full Name</FormLabel><Input name="name" value={formData.name || ''} onChange={handleInputChange} required/></div>
                <div><FormLabel>Email</FormLabel><Input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></div>
                <div><FormLabel>Phone</FormLabel><Input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} /></div>
                <div>
                    <FormLabel>Link to Company (Optional)</FormLabel>
                    <Select name="clientId" value={formData.clientId || ''} onChange={handleInputChange}>
                        <option value="">-- None --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
                    </Select>
                </div>
                <div><FormLabel>Tags (comma-separated)</FormLabel><Input name="tags" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''} onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t=>t.trim())})} /></div>
                <div><FormLabel>Notes</FormLabel><Textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleInputChange} /></div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                 {/* ✅ 2. Add the Duplicate button */}
                {isEditMode && onDuplicate && (
                    <button type="button" onClick={onDuplicate} className="flex items-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 mr-auto">
                        <Copy size={16}/> Duplicate
                    </button>
                )}
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <Save size={16}/> {isSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
            </div>
        </form>
    );
}