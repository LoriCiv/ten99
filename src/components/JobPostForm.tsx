"use client";

import { useState, useEffect } from 'react';
import type { JobPosting, UserProfile } from '@/types/app-interfaces';
import { Save, Loader2, X } from 'lucide-react';

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
        if (!formData.title || !formData.description) {
            alert("Title and Description are required.");
            return;
        }
        onSave(formData);
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

                    {/* ✅ NEW DATE & TIME FIELDS */}
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
                        <label className="block text-sm font-medium text-muted-foreground">Location (City, State)</label>
                        <input name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Zip Code (for matching)</label>
                        <input name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground">Required Skills (Tags)</label>
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