// src/components/ProfileForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { UserProfile, JobHistoryEntry, EducationEntry } from '@/types/app-interfaces';
import { uploadFile } from '@/utils/firestoreService';
import { Save, Loader2, Plus, Trash2, User as UserIcon } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

interface ProfileFormProps {
    onSave: (data: Partial<UserProfile>) => Promise<void>;
    initialProfile: UserProfile;
    isSubmitting: boolean;
}

export default function ProfileForm({ onSave, initialProfile, isSubmitting }: ProfileFormProps) {
    const [formData, setFormData] = useState<Partial<UserProfile>>(initialProfile);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [languageInput, setLanguageInput] = useState('');

    useEffect(() => { setFormData(initialProfile); }, [initialProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type } = e.target;
        const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setSelectedFile(e.target.files[0]); } };
    const handleJobHistoryChange = (index: number, field: keyof JobHistoryEntry, value: string) => { const newHistory = [...(formData.jobHistory || [])]; newHistory[index][field] = value; setFormData(prev => ({ ...prev, jobHistory: newHistory })); };
    const addJobHistoryEntry = () => { setFormData(prev => ({ ...prev, jobHistory: [...(prev.jobHistory || []), { title: '', company: '', years: '' }] })); };
    const removeJobHistoryEntry = (index: number) => { const newHistory = [...(formData.jobHistory || [])]; newHistory.splice(index, 1); setFormData(prev => ({ ...prev, jobHistory: newHistory })); };
    const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => { const newEducation = [...(formData.education || [])]; newEducation[index][field] = value; setFormData(prev => ({ ...prev, education: newEducation })); };
    const addEducationEntry = () => { setFormData(prev => ({ ...prev, education: [...(prev.education || []), { degree: '', institution: '', notes: '' }] })); };
    const removeEducationEntry = (index: number) => { const newEducation = [...(formData.education || [])]; newEducation.splice(index, 1); setFormData(prev => ({ ...prev, education: newEducation })); };
    const handleTagAdd = (type: 'skills' | 'languages', inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>) => { if (inputValue.trim() === '') return; const newTags = [...(formData[type] || []), inputValue.trim()]; setFormData(prev => ({ ...prev, [type]: newTags })); setInputValue(''); };
    const handleTagRemove = (type: 'skills' | 'languages', tagToRemove: string) => { const newTags = (formData[type] || []).filter(tag => tag !== tagToRemove); setFormData(prev => ({ ...prev, [type]: newTags })); };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalProfileData = { ...formData };
        if (selectedFile) {
            setIsUploading(true);
            try {
                const photoUrl = await uploadFile(TEMP_USER_ID, selectedFile);
                finalProfileData.photoUrl = photoUrl;
            } catch (error) { console.error("Photo upload failed:", error); alert("Photo upload failed."); setIsUploading(false); return; }
            setIsUploading(false);
        }
        await onSave(finalProfileData);
    };

    const isLoading = isSubmitting || isUploading;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-start gap-6">
                <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center border shrink-0">
                    {formData.photoUrl ? ( <img src={formData.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" /> ) : ( <UserIcon className="w-12 h-12 text-muted-foreground" /> )}
                </div>
                <div className="flex-1 space-y-2"><label className="block text-sm font-medium text-muted-foreground">Profile Photo</label><input type="file" onChange={handleFileChange} accept="image/*" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/></div>
            </div>
            <div><label className="block text-sm font-medium text-muted-foreground">Bio / Elevator Pitch</label><textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="A brief summary of your professional background..."></textarea></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-muted-foreground">Professional Title</label><input name="professionalTitle" value={formData.professionalTitle || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                 <div><label className="block text-sm font-medium text-muted-foreground">Phone Number</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                 <div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground">Address</label><textarea name="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="123 Main St, Anytown, USA 12345"></textarea></div>
                 <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isVirtual" id="isVirtual" checked={formData.isVirtual || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><label htmlFor="isVirtual" className="text-sm font-medium text-muted-foreground">Available for virtual work</label></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* ... (Skills and Languages sections) ... */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                {/* ... (Job History and Education sections) ... */}
            </div>

            {/* ✅ NEW SECTION FOR INVOICE DEFAULTS */}
            <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Invoice Defaults</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Default Notes / Terms & Conditions</label>
                        <textarea name="defaultInvoiceNotes" value={formData.defaultInvoiceNotes || ''} onChange={handleInputChange} rows={4} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Thank you for your business!"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Default Payment Details</label>
                        <textarea name="defaultPaymentDetails" value={formData.defaultPaymentDetails || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Venmo: @user, Zelle: user@email.com"></textarea>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-36 justify-center">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
}