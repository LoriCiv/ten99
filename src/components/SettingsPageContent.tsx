// src/components/SettingsPageContent.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Template, UserProfile } from '@/types/app-interfaces';
import { 
    addTemplate, 
    updateTemplate, 
    deleteTemplate,
    updateUserProfile
} from '@/utils/firestoreService';
import TemplateFormModal from './TemplateFormModal';
import ProfileForm from './ProfileForm';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface SettingsPageContentProps {
    initialTemplates: Template[];
    initialProfile: UserProfile;
    userId: string;
}

export default function SettingsPageContent({ initialTemplates, initialProfile, userId }: SettingsPageContentProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [profile, setProfile] = useState<UserProfile>(initialProfile);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'templates'>('profile');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => { setTemplates(initialTemplates); }, [initialTemplates]);
    useEffect(() => { setProfile(initialProfile); }, [initialProfile]);

    // --- Template Handlers ---
    const handleOpenTemplateModal = (template: Partial<Template> | null) => { setEditingTemplate(template); setIsTemplateModalOpen(true); };
    const handleCloseTemplateModal = () => { setIsTemplateModalOpen(false); setEditingTemplate(null); };
    const handleSaveTemplate = async (data: Partial<Template>) => {
        setIsSubmitting(true);
        try {
            if (editingTemplate?.id) {
                await updateTemplate(userId, editingTemplate.id, data);
                alert("Template updated!");
            } else {
                await addTemplate(userId, data);
                alert("Template added!");
            }
            handleCloseTemplateModal();
            router.refresh();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template.");
        } finally { setIsSubmitting(false); }
    };
    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteTemplate(userId, id);
                alert("Template deleted.");
                router.refresh();
            } catch (error) {
                console.error("Error deleting template:", error);
                alert("Failed to delete template.");
            }
        }
    };
    
    // --- Profile Handler ---
    const handleSaveProfile = async (data: Partial<UserProfile>) => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userId, data);
            alert("Profile updated successfully!");
            router.refresh();
        } catch (error) {
             console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                </header>

                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            My Profile
                        </button>
                        <button onClick={() => setActiveTab('templates')} className={`${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Message Templates
                        </button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'profile' && (
                        <ProfileForm 
                            initialProfile={profile}
                            onSave={handleSaveProfile}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {activeTab === 'templates' && (
                        <div>
                             <div className="flex justify-end mb-4">
                                <button onClick={() => handleOpenTemplateModal(null)} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                                    <PlusCircle size={20} /> Add Template
                                </button>
                            </div>
                            <div className="space-y-3">
                                {templates.map(template => (
                                    <div key={template.id} className="bg-card p-4 rounded-lg border flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-foreground">{template.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenTemplateModal(template)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteTemplate(template.id!)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border p-6">
                        <TemplateFormModal onSave={handleSaveTemplate} onCancel={handleCloseTemplateModal} initialData={editingTemplate || {}} isSubmitting={isSubmitting} />
                    </div>
                </div>
            )}
        </>
    );
}