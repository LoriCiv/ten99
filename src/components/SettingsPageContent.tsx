// src/components/SettingsPageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Template, UserProfile, InvoiceLineItemTemplate, Reminder } from '@/types/app-interfaces';
import { 
    addTemplate, 
    updateTemplate, 
    deleteTemplate, 
    updateUserProfile, 
    addReminder, 
    deleteReminder,
    getTemplates,
    getUserProfile,
    getReminders
} from '@/utils/firestoreService';
import TemplateFormModal from './TemplateFormModal';
import ProfileForm from './ProfileForm';
import { ThemeToggle } from './ThemeToggle';
import {
    PlusCircle, Edit, Trash2, Save, Loader2, ArrowUp, ArrowDown, Info, ThumbsUp,
    Calendar, Mail, Briefcase, FileText, Users, Receipt, DollarSign, Award, LifeBuoy,
    Settings as SettingsIcon, BellRing
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";

const defaultTermsText = `This contract incorporates pre-negotiated terms...`;
const defaultPaymentText = `Payment can be made via:\n- Venmo: @YourUsername...`;
const DEFAULT_EXPENSE_CATEGORIES = ['Travel', 'Equipment', 'Supplies', 'Professional Development', 'Other'];

const defaultTemplates = [
    {
        name: 'Decline Offer (Default)',
        subject: 'Update regarding your offer for: {{jobTitle}}',
        body: 'Hello {{clientName}},\n\nThank you for the offer for the "{{jobTitle}}" position. Unfortunately, I am unable to accept at this time.\n\nI appreciate you considering me and wish you the best in finding a suitable candidate.\n\nSincerely,\n{{yourName}}',
        type: 'decline' as const
    },
    {
        name: 'Accept Pending (Default)',
        subject: 'Regarding your offer for: {{jobTitle}}',
        body: 'Hello {{clientName}},\n\nThank you for the offer for the "{{jobTitle}}" position. I am very interested and will review the details shortly.\n\nPlease expect a final confirmation from me soon.\n\nBest,\n{{yourName}}',
        type: 'pending' as const
    }
];

const HowToTab = () => {
    const featureSections = [
        { title: "Schedule", features: [ { icon: ThumbsUp, name: "Dashboard", description: "Your at-a-glance command center for upcoming events, inbox items, and job alerts." }, { icon: Calendar, name: "Appointments", description: "A full calendar and list view of your entire schedule, color-coded by event type." }, { icon: Mail, name: "Mailbox", description: "The magic inbox. Forward client emails here to automatically create appointments and organize your work." } ] },
        { title: "Work", features: [ { icon: Briefcase, name: "Job Board", description: "Find new opportunities posted by the community or post your own jobs." }, { icon: FileText, name: "Job Files", description: "A dedicated folder for every job. Keep notes, files, and client info all in one place." }, { icon: Users, name: "Clients", description: "Your complete client database. Manage contact info, billing details, and communication history." } ] },
        { title: "Finances", features: [ { icon: Receipt, name: "Invoices", description: "Create, send, and track professional invoices. Drafts are created automatically from completed jobs." }, { icon: DollarSign, name: "My Money", description: "Your financial dashboard. Track income, log expenses with AI receipt-scanning, and estimate your tax liability." } ] },
        { title: "Account", features: [ { icon: Award, name: "Credentials", description: "Track your licenses, certifications, and continuing education units (CEUs) with progress bars." }, { icon: SettingsIcon, name: "Settings", description: "Customize the app to your workflow, from invoice defaults to automated email templates." } ] }
    ];

    return (
        <div className="space-y-8 max-w-4xl">
            {featureSections.map(section => (
                <div key={section.title}>
                    <h2 className="text-2xl font-bold text-foreground border-b pb-2 mb-4">{section.title}</h2>
                    <div className="space-y-4">
                        {section.features.map(feature => (
                            <div key={feature.name} className="flex items-start gap-4">
                                <feature.icon className="h-6 w-6 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-foreground">{feature.name}</h4>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="pt-8 mt-8 border-t">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <LifeBuoy className="h-6 w-6" />
                    Need Help?
                </h2>
                <div className="bg-card p-6 rounded-lg border space-y-3">
                    <p className="text-muted-foreground">
                        For support, feature requests, or to report a bug, please don&apos;t hesitate to reach out.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <a href="mailto:support@ten99.app" className="text-primary font-semibold hover:underline">support@ten99.app</a>
                        <a href="https://www.tenflow.app" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">www.tenflow.app</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SettingsPageContentProps {
    userId: string;
}

export default function SettingsPageContent({ userId }: SettingsPageContentProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'expenses' | 'invoicing' | 'inbox' | 'howto' | 'reminders'>('profile');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newReminder, setNewReminder] = useState<Partial<Reminder>>({ type: 'one-time', text: '' });

    useEffect(() => {
        if (!userId) return;

        setIsLoading(true);

        const unsubProfile = getUserProfile(userId, (profileData) => {
            if (profileData) {
                setProfile({
                    ...profileData,
                    expenseCategories: profileData.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
                    defaultInvoiceNotes: profileData.defaultInvoiceNotes || defaultTermsText,
                    defaultPaymentDetails: profileData.defaultPaymentDetails || defaultPaymentText,
                    invoiceLineItems: profileData.invoiceLineItems || [],
                });
            }
            setIsLoading(false);
        });

        const unsubTemplates = getTemplates(userId, (templateData) => {
            setTemplates(templateData);
            if (templateData.length === 0) {
                const setupNewUser = async () => {
                    try {
                        for (const template of defaultTemplates) {
                            await addTemplate(userId, template);
                        }
                    } catch (error) {
                        console.error("Failed to create default templates:", error);
                    }
                };
                setupNewUser();
            }
        });

        const unsubReminders = getReminders(userId, setReminders);

        return () => {
            unsubProfile();
            unsubTemplates();
            unsubReminders();
        };
    }, [userId]);

    const handleSaveSettings = async (dataToSave: Partial<UserProfile>) => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userId, dataToSave);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenTemplateModal = (template: Partial<Template> | null) => { setEditingTemplate(template); setIsTemplateModalOpen(true); };
    const handleCloseTemplateModal = () => { setIsTemplateModalOpen(false); setEditingTemplate(null); };
    
    const handleSaveTemplate = async (data: Partial<Template>) => {
        setIsSubmitting(true);
        try {
            if (editingTemplate?.id) { await updateTemplate(userId, editingTemplate.id, data); }
            else { await addTemplate(userId, data); }
            alert("Template saved!");
            handleCloseTemplateModal();
        } catch (error) { console.error("Error saving template:", error); alert("Failed to save template.");
        } finally { setIsSubmitting(false); }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm("Are you sure?")) {
            try {
                await deleteTemplate(userId, id);
                alert("Template deleted.");
            } catch (error) { console.error("Error deleting template:", error); alert("Failed to delete template."); }
        }
    };
    
    const handleAddCategory = () => {
        const newCategoryInput = document.getElementById('newCategoryInput') as HTMLInputElement;
        const newCategory = newCategoryInput?.value.trim();
        if (newCategory && !(profile.expenseCategories || []).find(c => c.toLowerCase() === newCategory.toLowerCase())) {
            setProfile(p => ({ ...p, expenseCategories: [...(p.expenseCategories || []), newCategory] }));
            newCategoryInput.value = '';
        }
    };

    const handleDeleteCategory = (categoryToDelete: string) => {
        if (DEFAULT_EXPENSE_CATEGORIES.includes(categoryToDelete)) { return alert("Default categories cannot be deleted."); }
        setProfile(p => ({ ...p, expenseCategories: (p.expenseCategories || []).filter(cat => cat !== categoryToDelete) }));
    };

    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...(profile.expenseCategories || [])];
        const item = newCategories.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newCategories.splice(newIndex, 0, item);
        setProfile(p => ({...p, expenseCategories: newCategories}));
    };

    const handleAddLineItem = () => {
        const descInput = document.getElementById('newItemDesc') as HTMLInputElement;
        const priceInput = document.getElementById('newItemPrice') as HTMLInputElement;
        const taxableInput = document.getElementById('newItemIsTaxable') as HTMLInputElement;
        const description = descInput?.value.trim();
        const unitPrice = parseFloat(priceInput?.value);
        if (description && !isNaN(unitPrice)) {
            const newItem: InvoiceLineItemTemplate = { id: crypto.randomUUID(), description, unitPrice, isTaxable: taxableInput?.checked };
            setProfile(p => ({ ...p, invoiceLineItems: [...(p.invoiceLineItems || []), newItem]}));
            descInput.value = ''; priceInput.value = ''; taxableInput.checked = true;
        }
    };

    const handleDeleteLineItem = (id: string) => {
        setProfile(p => ({...p, invoiceLineItems: (p.invoiceLineItems || []).filter(item => item.id !== id)}));
    };

    const handleToggleLineItemTaxable = (id: string) => {
        setProfile(p => ({ ...p, invoiceLineItems: (p.invoiceLineItems || []).map(item =>
            item.id === id ? { ...item, isTaxable: !item.isTaxable } : item
        )}));
    };

    const handleSaveReminder = async () => {
        if (!newReminder.text) {
            alert("Please enter the reminder text.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addReminder(userId, newReminder);
            setNewReminder({ type: 'one-time', text: '' });
        } catch (error) {
            console.error("Error saving reminder:", error);
            alert("Failed to save reminder.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this reminder?")) {
            try {
                await deleteReminder(userId, id);
            } catch (error) {
                console.error("Error deleting reminder:", error);
                alert("Failed to delete reminder.");
            }
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Settings...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6"><h1 className="text-3xl font-bold text-foreground">Settings</h1></header>

                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>My Profile</button>
                        <button onClick={() => setActiveTab('reminders')} className={`${activeTab === 'reminders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Reminders</button>
                        <button onClick={() => setActiveTab('notifications')} className={`${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Notifications</button>
                        <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Expenses</button>
                        <button onClick={() => setActiveTab('invoicing')} className={`${activeTab === 'invoicing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Invoice Settings</button>
                        <button onClick={() => setActiveTab('inbox')} className={`${activeTab === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Inbox</button>
                        <button onClick={() => setActiveTab('howto')} className={`${activeTab === 'howto' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>How To</button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <ProfileForm
                                initialProfile={profile}
                                onSave={handleSaveSettings}
                                isSubmitting={isSubmitting}
                                userId={userId}
                            />
                            <div className="max-w-2xl pt-8 border-t">
                                <h2 className="text-xl font-semibold">Appearance</h2>
                                <p className="text-muted-foreground text-sm mt-1">Customize the look and feel of the app.</p>
                                <div className="bg-card p-6 rounded-lg border mt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="font-medium text-foreground">Theme</label>
                                            <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
                                        </div>
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'reminders' && (
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <h2 className="text-xl font-semibold">Custom Reminders</h2>
                                <p className="text-muted-foreground text-sm mt-1">Create personal reminders that will appear on your dashboard.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border space-y-4">
                                <h3 className="font-medium text-foreground">Add New Reminder</h3>
                                <div>
                                    <label htmlFor="reminderText" className="block text-sm font-medium text-muted-foreground">Reminder Text</label>
                                    <input id="reminderText" type="text" value={newReminder.text} onChange={(e) => setNewReminder(p => ({ ...p, text: e.target.value }))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Don't forget to bring shoes" />
                                </div>
                                <div>
                                    <label htmlFor="reminderType" className="block text-sm font-medium text-muted-foreground">Type</label>
                                    <select id="reminderType" value={newReminder.type} onChange={(e) => setNewReminder(p => ({ ...p, type: e.target.value as 'one-time' | 'recurring' }))} className="w-full mt-1 p-2 bg-background border rounded-md">
                                        <option value="one-time">One-Time</option>
                                        <option value="recurring">Recurring</option>
                                    </select>
                                </div>
                                {newReminder.type === 'one-time' && (
                                    <div>
                                        <label htmlFor="reminderDate" className="block text-sm font-medium text-muted-foreground">Date</label>
                                        <input id="reminderDate" type="date" value={newReminder.reminderDate || ''} onChange={(e) => setNewReminder(p => ({ ...p, reminderDate: e.target.value }))} className="w-full mt-1 p-2 bg-background border rounded-md"/>
                                    </div>
                                )}
                                {newReminder.type === 'recurring' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="reminderFreq" className="block text-sm font-medium text-muted-foreground">Frequency</label>
                                            <select id="reminderFreq" value={newReminder.frequency || 'weekly'} onChange={(e) => setNewReminder(p => ({ ...p, frequency: e.target.value as 'weekly' | 'monthly' }))} className="w-full mt-1 p-2 bg-background border rounded-md">
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        {newReminder.frequency === 'weekly' ? (
                                            <div>
                                                <label htmlFor="reminderDay" className="block text-sm font-medium text-muted-foreground">Day of Week</label>
                                                <select id="reminderDay" value={newReminder.dayOfWeek || 'Monday'} onChange={(e) => setNewReminder(p => ({ ...p, dayOfWeek: e.target.value as any }))} className="w-full mt-1 p-2 bg-background border rounded-md">
                                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => <option key={day} value={day}>{day}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label htmlFor="reminderDateOfMonth" className="block text-sm font-medium text-muted-foreground">Day of Month</label>
                                                <input id="reminderDateOfMonth" type="number" min="1" max="31" value={newReminder.dateOfMonth || 1} onChange={(e) => setNewReminder(p => ({ ...p, dateOfMonth: parseInt(e.target.value) }))} className="w-full mt-1 p-2 bg-background border rounded-md"/>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button onClick={handleSaveReminder} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Reminder
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium text-foreground mb-2">Your Reminders</h3>
                                <div className="space-y-2">
                                    {reminders.map(reminder => (
                                        <div key={reminder.id} className="bg-card p-3 rounded-lg border flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-foreground flex items-center gap-2"><BellRing size={14}/> {reminder.text}</p>
                                                <p className="text-xs text-muted-foreground pl-7">
                                                    {reminder.type === 'one-time' && `On ${reminder.reminderDate}`}
                                                    {reminder.type === 'recurring' && `Every ${reminder.frequency === 'weekly' ? reminder.dayOfWeek : `the ${reminder.dateOfMonth}th`}`}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteReminder(reminder.id!)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {reminders.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">You haven&apos;t created any reminders yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                                <p className="text-muted-foreground text-sm mt-1">Choose how and when you want to be notified.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label htmlFor="notifyOnNewMessage" className="font-medium text-foreground">New Inbox Messages</label>
                                        <p className="text-xs text-muted-foreground">Receive a notification for new messages in your Ten99 inbox.</p>
                                    </div>
                                    <Switch id="notifyOnNewMessage" checked={profile.notifyOnNewMessage || false} onCheckedChange={(checked) => setProfile(p => ({ ...p, notifyOnNewMessage: checked }))}/>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label htmlFor="notifyOnJobMatch" className="font-medium text-foreground">New Job Matches</label>
                                        <p className="text-xs text-muted-foreground">Get notified when a new job matching your skills is posted.</p>
                                    </div>
                                    <Switch id="notifyOnJobMatch" checked={profile.notifyOnJobMatch || false} onCheckedChange={(checked) => setProfile(p => ({ ...p, notifyOnJobMatch: checked }))}/>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={() => handleSaveSettings(profile)} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Notification Settings
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'expenses' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-xl font-semibold">Expense Categories</h2>
                                <p className="text-muted-foreground text-sm mt-1">Add, remove, or re-order your custom expense categories.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <div className="space-y-2">
                                    {(profile.expenseCategories || DEFAULT_EXPENSE_CATEGORIES).map((category, index) => (
                                        <div key={category} className="flex justify-between items-center bg-background p-2 rounded-md group">
                                            <span>{category}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0} className="p-1 rounded-full text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed"><ArrowUp size={16} /></button>
                                                <button onClick={() => handleMoveCategory(index, 'down')} disabled={index === (profile.expenseCategories || []).length - 1} className="p-1 rounded-full text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed"><ArrowDown size={16} /></button>
                                                {!DEFAULT_EXPENSE_CATEGORIES.includes(category) && (
                                                    <button onClick={() => handleDeleteCategory(category)} className="p-1 rounded-full text-muted-foreground hover:text-destructive ml-2"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <input id="newCategoryInput" type="text" className="w-full p-2 bg-background border rounded-md" placeholder="Add new category name"/>
                                    <button onClick={handleAddCategory} className="bg-secondary text-secondary-foreground font-semibold p-2 rounded-lg hover:bg-secondary/80"><PlusCircle size={20} /></button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={() => handleSaveSettings(profile)} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Expense Settings
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'invoicing' && (
                        <div className="space-y-8 max-w-4xl">
                            <div>
                                <h2 className="text-xl font-semibold">Invoice Defaults</h2>
                                <p className="text-muted-foreground text-sm mt-1">Set defaults that will appear on every new invoice.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center"><label htmlFor="defaultTaxRate" className="block text-sm font-medium text-muted-foreground">Default Tax Rate (%)</label><a href="https://www.avalara.com/taxrates/en/state-rates.html" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline flex items-center gap-1"><Info size={12} />Look up sales tax rates</a></div>
                                    <input id="defaultTaxRate" type="number" value={profile.defaultTaxRate || ''} onChange={(e) => setProfile(p => ({ ...p, defaultTaxRate: e.target.value === '' ? undefined : Number(e.target.value) }))} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., 7.25" step="0.01"/>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" id="sendOverdueReminders" name="sendOverdueReminders" checked={profile.sendOverdueReminders || false} onChange={(e) => setProfile(p => ({ ...p, sendOverdueReminders: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <label htmlFor="sendOverdueReminders" className="text-sm font-medium text-muted-foreground">Automatically send reminders for overdue invoices</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Notes / Terms & Conditions</label>
                                    <textarea value={profile.defaultInvoiceNotes || ''} onChange={(e) => setProfile(p => ({...p, defaultInvoiceNotes: e.target.value}))} rows={5} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Payment Details</label>
                                    <textarea value={profile.defaultPaymentDetails || ''} onChange={(e) => setProfile(p => ({...p, defaultPaymentDetails: e.target.value}))} rows={4} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                            </div>
                            <div className="pt-8 border-t">
                                <h2 className="text-xl font-semibold">Reusable Line Items</h2>
                                <p className="text-muted-foreground text-sm mt-1">Create a list of common services to quickly add them to new invoices.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <div className="space-y-2">
                                    {(profile.invoiceLineItems || []).map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={!!item.isTaxable} onChange={() => handleToggleLineItemTaxable(item.id)} className="cursor-pointer h-4 w-4" />
                                                <div><span>{item.description}</span><p className="text-xs text-muted-foreground">({item.isTaxable ? 'Taxable' : 'Non-Taxable'})</p></div>
                                            </div>
                                            <div className="flex items-center gap-2"><span className="font-mono text-sm">${item.unitPrice.toFixed(2)}</span><button onClick={() => handleDeleteLineItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-full"><Trash2 size={16} /></button></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                    <input id="newItemDesc" type="text" className="md:col-span-2 w-full p-2 bg-background border rounded-md" placeholder="New item description..."/>
                                    <input id="newItemPrice" type="number" className="w-full p-2 bg-background border rounded-md" placeholder="Price"/>
                                    <div className="flex items-center gap-2"><input id="newItemIsTaxable" type="checkbox" defaultChecked className="h-4 w-4"/><label htmlFor="newItemIsTaxable" className="text-sm">Taxable</label></div>
                                    <button onClick={handleAddLineItem} className="md:col-span-4 w-full mt-2 bg-secondary text-secondary-foreground font-semibold p-2 rounded-lg hover:bg-secondary/80 flex items-center justify-center gap-2"><PlusCircle size={20} /> Add Item</button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-6">
                                <button onClick={() => handleSaveSettings(profile)} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSubmitting ? 'Saving...' : 'Save Invoice Settings'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inbox' && (
                        <div className="space-y-8 max-w-4xl">
                            <div>
                                <h2 className="text-xl font-semibold">Inbox Automation</h2>
                                <p className="text-muted-foreground text-sm mt-1">Configure settings to automate your inbound requests.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <div>
                                    <label htmlFor="defaultForwardingEmail" className="block text-sm font-medium">Default Forwarding Email</label>
                                    <input 
                                        id="defaultForwardingEmail"
                                        type="email" 
                                        value={profile.defaultForwardingEmail || ''} 
                                        onChange={(e) => setProfile(p => ({ ...p, defaultForwardingEmail: e.target.value }))}
                                        className="w-full mt-1 p-2 bg-background border rounded-md"
                                        placeholder="e.g., yourname.forward@example.com"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Emails received from this address will be automatically confirmed on your calendar. If a double booking is detected, you&apos;ll receive a warning message in your inbox instead.
                                    </p>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button onClick={() => handleSaveSettings(profile)} disabled={isSubmitting} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                                        Save Automation Settings
                                    </button>
                                </div>
                            </div>
                            <hr className="my-8" />
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">Message Templates</h2>
                                        <p className="text-muted-foreground text-sm mt-1">Create reusable replies for your inbox.</p>
                                    </div>
                                    <button onClick={() => handleOpenTemplateModal(null)} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/90"><PlusCircle size={20} /> Add Template</button>
                                </div>
                                <div className="space-y-3">
                                    {templates.map(template => (
                                        <div key={template.id} className="bg-card p-4 rounded-lg border flex justify-between items-center">
                                            <div><p className="font-bold text-foreground">{template.name}</p><p className="text-sm text-muted-foreground truncate">{template.subject}</p></div>
                                            <div className="flex gap-2"><button onClick={() => handleOpenTemplateModal(template)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit size={16}/></button><button onClick={() => handleDeleteTemplate(template.id!)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'howto' && <HowToTab />}
                </div>
            </div>
            {isTemplateModalOpen && ( <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"><div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border p-6"><TemplateFormModal onSave={handleSaveTemplate} onCancel={handleCloseTemplateModal} initialData={editingTemplate || {}} isSubmitting={isSubmitting} /></div></div> )}
        </>
    );
}