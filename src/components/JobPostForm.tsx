// src/components/JobPostForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { Save, Loader2, X, Info } from 'lucide-react'; // ✅ 1. Import Info icon

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

interface JobPostFormProps {
    onSave: (data: Partial<JobPosting>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    userProfile: UserProfile | null;
    postsRemaining: number;
    postLimit: number;
}

export default function JobPostForm({ onSave, onCancel, isSubmitting, userProfile, postsRemaining, postLimit }: JobPostFormProps) {
    const [formData, setFormData] = useState<Partial<JobPosting>>({
        jobType: 'On-site',
        isFilled: false,
    });
    const [skillInput, setSkillInput] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // ✅ 2. Add state for error messages

    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                zipCode: prev.zipCode || userProfile.zipCode || ''
            }));
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillInput.trim() !== '') {
            e.preventDefault();
            const newSkill = skillInput.trim();
            const currentSkills = formData.requiredSkills || [];
            if (!currentSkills.includes(newSkill)) {
                setFormData(prev => ({...prev, requiredSkills: [...currentSkills, newSkill]}));
            }
            setSkillInput('');
        }
    };
    
    const handleTagRemove = (skillToRemove: string) => {
        setFormData(prev => ({...prev, requiredSkills: (prev.requiredSkills || []).filter(skill => skill !== skillToRemove)}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null); // Clear previous errors

        // ✅ 3. Replace alert() with a state-based error message
        if (!formData.title || !formData.description) {
            setErrorMessage("Title and Description are required.");
            return;
        }
        const dataToSave = {
            ...formData,
            location: `${formData.location || ''}, ${formData.state || ''}`
        };
        onSave(dataToSave);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg border max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Post a New Job</h2>
                    <p className="text-sm text-muted-foreground">You have {postsRemaining} of {postLimit} posts remaining this month.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground">Job Title*</label>
                        <input name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Start Date</label>
                        <input name="startDate" type="date" value={formData.startDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">End Date (optional)</label>
                        <input name="endDate" type="date" value={formData.endDate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground">Start Time</label>
                        <input name="startTime" type="time" value={formData.startTime || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">End Time</label>
                        <input name="endTime" type="time" value={formData.endTime || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Job Type</label>
                        <select name="jobType" value={formData.jobType || 'On-site'} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                            <option>On-site</option>
                            <option>Virtual</option>
                            <option>Hybrid</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground">Rate / Pay</label>
                        <input name="rate" value={formData.rate || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., $50/hr, DOE" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">City</label>
                        <input name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Atlanta" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">State</label>
                        <select name="state" value={formData.state || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md">
                            <option value="">Select a State</option>
                            {usStates.map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Zip Code (for matching)</label>
                        <input name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                    
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground">Required Skills (Tags)</label>
                        <p className="text-xs text-muted-foreground mt-1">
                            These tags are how freelancers find your job. Be specific! 
                            Examples: ASL, Medical, Legal, Spanish, Conference, etc.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background min-h-[42px] mt-1">
                            {(formData.requiredSkills || []).map(tag => (
                                <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-medium px-2 py-1 rounded-full">
                                    <span>{tag}</span>
                                    <button type="button" onClick={() => handleTagRemove(tag)} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
                                </div>
                            ))}
                            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleTagAdd} placeholder="Type a skill and press Enter" className="flex-grow bg-transparent outline-none p-1"/>
                        </div>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground">Job Description*</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={6} className="w-full mt-1 p-2 bg-background border rounded-md" required></textarea>
                    </div>
                </div>

                {/* ✅ 4. Display the error message here if it exists */}
                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                        <Info size={16} />
                        <span className="text-sm">{errorMessage}</span>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-36 justify-center">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSubmitting ? 'Posting...' : 'Post Job'}
                    </button>
                </div>
            </form>
        </div>
    );
}