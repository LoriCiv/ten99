// src/components/SettingsPageContent.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Template, UserProfile } from '@/types/app-interfaces';
import { addTemplate, updateTemplate, deleteTemplate, updateUserProfile } from '@/utils/firestoreService';
import TemplateFormModal from './TemplateFormModal';
import ProfileForm from './ProfileForm';
import { PlusCircle, Edit, Trash2, Save, Loader2 } from 'lucide-react';

// ✅ 1. Define our helpful default text
const defaultTermsText = `This contract incorporates pre-negotiated terms and conditions governing the provision of interpretation services. Receipt of this invoice means these services have been completed, and you acknowledge your agreement to these terms and conditions without further negotiation. These terms are non-negotiable and supersede all prior or contemporaneous communications, representations, or agreements, whether oral or written.`;
const defaultPaymentText = `Payment can be made via:\n- Venmo: @YourUsername\n- Zelle: your@email.com\n\nThank you for your business!`;


interface SettingsPageContentProps {
    initialTemplates: Template[];
    initialProfile: UserProfile;
    userId: string;
}

export default function SettingsPageContent({ initialTemplates, initialProfile, userId }: SettingsPageContentProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [profile, setProfile] = useState<UserProfile>(initialProfile);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'invoicing'>('profile');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [invoiceNotes, setInvoiceNotes] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    
    useEffect(() => {
        setTemplates(initialTemplates);
        setProfile(initialProfile);
        // ✅ 2. Use the defaults if the user hasn't saved their own text yet
        setInvoiceNotes(initialProfile.defaultInvoiceNotes || defaultTermsText);
        setPaymentDetails(initialProfile.defaultPaymentDetails || defaultPaymentText);
    }, [initialTemplates, initialProfile]);

    const handleOpenTemplateModal = (template: Partial<Template> | null) => { setEditingTemplate(template); setIsTemplateModalOpen(true); };
    const handleCloseTemplateModal = () => { setIsTemplateModalOpen(false); setEditingTemplate(null); };
    const handleSaveTemplate = async (data: Partial<Template>) => { /* ... (no change) ... */ };
    const handleDeleteTemplate = async (id: string) => { /* ... (no change) ... */ };
    
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

    const handleSaveInvoiceSettings = async () => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userId, {
                defaultInvoiceNotes: invoiceNotes,
                defaultPaymentDetails: paymentDetails,
            });
            alert("Invoice settings updated!");
            router.refresh();
        } catch (error) {
            console.error("Error saving invoice settings:", error);
            alert("Failed to save invoice settings.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6"><h1 className="text-3xl font-bold text-foreground">Settings</h1></header>

                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>My Profile</button>
                        <button onClick={() => setActiveTab('templates')} className={`${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Message Templates</button>
                        <button onClick={() => setActiveTab('invoicing')} className={`${activeTab === 'invoicing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Invoice Settings</button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'profile' && ( <ProfileForm initialProfile={profile} onSave={handleSaveProfile} isSubmitting={isSubmitting}/> )}
                    
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

                    {activeTab === 'invoicing' && (
                        <div className="space-y-8 max-w-4xl">
                            <div>
                                <h2 className="text-xl font-semibold">Invoice Defaults</h2>
                                <p className="text-muted-foreground text-sm mt-1">Set the default text that appears on every new invoice you create.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Notes / Terms & Conditions</label>
                                    <textarea value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} rows={5} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Payment Details</label>
                                    <textarea value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} rows={4} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t">
                                <button onClick={handleSaveInvoiceSettings} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSubmitting ? 'Saving...' : 'Save Invoice Settings'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isTemplateModalOpen && ( <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"><div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border p-6"><TemplateFormModal onSave={handleSaveTemplate} onCancel={handleCloseTemplateModal} initialData={editingTemplate || {}} isSubmitting={isSubmitting} /></div></div> )}
        </>
    );
}