"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserProfile, JobHistoryEntry, EducationEntry } from '@/types/app-interfaces';
import { uploadFile } from '@/utils/firestoreService';
import { Save, Loader2, Plus, Trash2, User as UserIcon, ExternalLink } from 'lucide-react';

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

interface ProfileFormProps {
    initialProfile: Partial<UserProfile>;
    onSave: (data: Partial<UserProfile>) => Promise<void>;
    isSubmitting: boolean;
    userId: string;
}

export default function ProfileForm({ initialProfile, onSave, isSubmitting, userId }: ProfileFormProps) {
    const [formData, setFormData] = useState<Partial<UserProfile>>(initialProfile);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [languageInput, setLanguageInput] = useState('');

    useEffect(() => {
        setFormData(initialProfile);
    }, [initialProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        const profileDataToSave = { ...formData };

        if (selectedFile) {
            setIsUploading(true);
            try {
                // ✅ Use the real userId for the photo upload
                const photoUrl = await uploadFile(userId, selectedFile);
                profileDataToSave.photoUrl = photoUrl;
            } catch (error) {
                console.error("Photo upload failed:", error);
                alert("Photo upload failed. Please try again.");
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }
        await onSave(profileDataToSave);
    };

    const isLoading = isSubmitting || isUploading;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
             <div className="flex justify-between items-center pb-4 border-b">
                 <h2 className="text-xl font-semibold">Public Profile Settings</h2>
                 <Link href={`/profile/${userId}`} target="_blank" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                     View My Public Profile <ExternalLink size={14} />
                 </Link>
             </div>

             <div className="flex items-start gap-6">
                  <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center border shrink-0 overflow-hidden">
                       {formData.photoUrl ? (
                           <Image src={formData.photoUrl} alt="Profile" fill style={{ objectFit: 'cover' }} />
                       ) : (
                           <UserIcon className="w-12 h-12 text-muted-foreground" />
                       )}
                  </div>
                  <div className="flex-1 space-y-2"><label className="block text-sm font-medium text-muted-foreground">Profile Photo</label><input type="file" onChange={handleFileChange} accept="image/*" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/></div>
             </div>
             <div><label className="block text-sm font-medium text-muted-foreground">Bio / Elevator Pitch</label><textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="A brief summary of your professional background..."></textarea></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                      <input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Jane Doe"/>
                  </div>
                 <div><label className="block text-sm font-medium text-muted-foreground">Professional Title</label><input name="professionalTitle" value={formData.professionalTitle || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                 <div><label className="block text-sm font-medium text-muted-foreground">Phone Number</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" /></div>
                 <div className="md:col-span-2"><label className="block text-sm font-medium text-muted-foreground">Address</label><textarea name="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="123 Main St, Anytown, USA 12345"></textarea></div>
                 
                 <div>
                     <label className="block text-sm font-medium text-muted-foreground">State</label>
                     <select name="state" value={formData.state || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                         <option value="">Select your state</option>
                         {usStates.map(state => <option key={state} value={state}>{state}</option>)}
                     </select>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-muted-foreground">Zip Code</label>
                     <input name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                 </div>

                 <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isVirtual" id="isVirtual" checked={formData.isVirtual || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><label htmlFor="isVirtual" className="text-sm font-medium text-muted-foreground">Available for virtual work</label></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Skills / Specialties</label>
                      <p className="text-xs text-muted-foreground mb-2">These tags are used to match you with jobs on the job board.</p>
                      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background min-h-[42px]">{ (formData.skills || []).map(tag => (<div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-medium px-2 py-1 rounded-full"><span>{tag}</span><button type="button" onClick={() => handleTagRemove('skills', tag)}>&times;</button></div>))}{<input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd('skills', skillInput, setSkillInput))} placeholder="Add skill..." className="flex-grow bg-transparent outline-none p-1"/>}</div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Languages</label>
                      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background min-h-[42px]">{ (formData.languages || []).map(tag => (<div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-medium px-2 py-1 rounded-full"><span>{tag}</span><button type="button" onClick={() => handleTagRemove('languages', tag)}>&times;</button></div>))}{<input type="text" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd('languages', languageInput, setLanguageInput))} placeholder="Add language..." className="flex-grow bg-transparent outline-none p-1"/>}</div>
                  </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                  <div>
                      <h3 className="text-lg font-semibold mb-2">Job History</h3>
                      <div className="space-y-4">{ (formData.jobHistory || []).map((entry, index) => (<div key={index} className="grid grid-cols-1 gap-2 p-3 border rounded-md bg-background/50 relative">
                          <input value={entry.title} onChange={e => handleJobHistoryChange(index, 'title', e.target.value)} placeholder="Job Title" className="w-full p-2 bg-background border rounded-md" />
                          <input value={entry.company} onChange={e => handleJobHistoryChange(index, 'company', e.target.value)} placeholder="Company" className="w-full p-2 bg-background border rounded-md" />
                          <input value={entry.years} onChange={e => handleJobHistoryChange(index, 'years', e.target.value)} placeholder="Years (e.g., 2020-2023)" className="w-full p-2 bg-background border rounded-md" />
                          <button type="button" onClick={() => removeJobHistoryEntry(index)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"><Trash2 size={14}/></button>
                      </div>))}<button type="button" onClick={addJobHistoryEntry} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-2"><Plus size={16}/> Add Job Entry</button></div>
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold mb-2">Education</h3>
                      <div className="space-y-4">{ (formData.education || []).map((entry, index) => (<div key={index} className="grid grid-cols-1 gap-2 p-3 border rounded-md bg-background/50 relative">
                          <input value={entry.degree} onChange={e => handleEducationChange(index, 'degree', e.target.value)} placeholder="Degree" className="w-full p-2 bg-background border rounded-md" />
                          <input value={entry.institution} onChange={e => handleEducationChange(index, 'institution', e.target.value)} placeholder="Institution" className="w-full p-2 bg-background border rounded-md" />
                          <button type="button" onClick={() => removeEducationEntry(index)} className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"><Trash2 size={14}/></button>
                      </div>))}<button type="button" onClick={addEducationEntry} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-2"><Plus size={16}/> Add Education Entry</button></div>
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