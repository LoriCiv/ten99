"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Template, UserProfile, InvoiceLineItemTemplate } from '@/types/app-interfaces';
import { addTemplate, updateTemplate, deleteTemplate, updateUserProfile } from '@/utils/firestoreService';
import TemplateFormModal from './TemplateFormModal';
import ProfileForm from './ProfileForm';
import { PlusCircle, Edit, Trash2, Save, Loader2, ArrowUp, ArrowDown, Info } from 'lucide-react';

const defaultTermsText = `This contract incorporates pre-negotiated terms and conditions governing the provision of interpretation services. Receipt of this invoice means these services have been completed, and you acknowledge your agreement to these terms and conditions without further negotiation. These terms are non-negotiable and supersede all prior or contemporaneous communications, representations, or agreements, whether oral or written.`;
const defaultPaymentText = `Payment can be made via:\n- Venmo: @YourUsername\n- Zelle: your@email.com\n\nThank you for your business!`;
const DEFAULT_EXPENSE_CATEGORIES = ['Travel', 'Equipment', 'Supplies', 'Professional Development', 'Other'];

interface SettingsPageContentProps {
    initialTemplates: Template[];
    initialProfile: UserProfile;
    userId: string;
}

export default function SettingsPageContent({ initialTemplates, initialProfile, userId }: SettingsPageContentProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [profile, setProfile] = useState<UserProfile>(initialProfile);
    const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'invoicing' | 'expenses'>('profile');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for Invoicing Tab
    const [invoiceNotes, setInvoiceNotes] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [lineItems, setLineItems] = useState<InvoiceLineItemTemplate[]>([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
    const [newItemIsTaxable, setNewItemIsTaxable] = useState(true);
    const [defaultTaxRate, setDefaultTaxRate] = useState<number | ''>('');

    // State for Expenses Tab
    const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    
    useEffect(() => {
        setTemplates(initialTemplates);
        setProfile(initialProfile);
        setInvoiceNotes(initialProfile.defaultInvoiceNotes || defaultTermsText);
        setPaymentDetails(initialProfile.defaultPaymentDetails || defaultPaymentText);
        setExpenseCategories(initialProfile.expenseCategories || DEFAULT_EXPENSE_CATEGORIES);
        setLineItems(initialProfile.invoiceLineItems || []);
        setDefaultTaxRate(initialProfile.defaultTaxRate || '');
    }, [initialTemplates, initialProfile]);

    const handleOpenTemplateModal = (template: Partial<Template> | null) => { setEditingTemplate(template); setIsTemplateModalOpen(true); };
    const handleCloseTemplateModal = () => { setIsTemplateModalOpen(false); setEditingTemplate(null); };
    const handleSaveTemplate = async (data: Partial<Template>) => {
        setIsSubmitting(true);
        try {
            if (editingTemplate?.id) {
                await updateTemplate(userId, editingTemplate.id, data);
            } else {
                await addTemplate(userId, data);
            }
            alert("Template saved!");
            handleCloseTemplateModal();
            router.refresh();
        } catch (error) { console.error("Error saving template:", error); alert("Failed to save template.");
        } finally { setIsSubmitting(false); }
    };
    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm("Are you sure?")) {
            try {
                await deleteTemplate(userId, id);
                alert("Template deleted.");
                router.refresh();
            } catch (error) { console.error("Error deleting template:", error); alert("Failed to delete template."); }
        }
    };
    
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

    const handleAddCategory = () => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory && !expenseCategories.find(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
            setExpenseCategories([...expenseCategories, trimmedCategory]);
            setNewCategory('');
        }
    };
    const handleDeleteCategory = (categoryToDelete: string) => {
        if (DEFAULT_EXPENSE_CATEGORIES.includes(categoryToDelete)) {
            alert("Default categories cannot be deleted.");
            return;
        }
        setExpenseCategories(expenseCategories.filter(cat => cat !== categoryToDelete));
    };
    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...expenseCategories];
        const item = newCategories.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newCategories.splice(newIndex, 0, item);
        setExpenseCategories(newCategories);
    };
    const handleSaveExpenseSettings = async () => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userId, { expenseCategories });
            alert("Expense categories updated!");
            router.refresh();
        } catch (error) {
            console.error("Error saving expense categories:", error);
            alert("Failed to save expense categories.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddLineItem = () => {
        if (newItemDesc.trim() && newItemPrice !== '') {
            const newItem: InvoiceLineItemTemplate = {
                id: crypto.randomUUID(),
                description: newItemDesc.trim(),
                unitPrice: Number(newItemPrice),
                isTaxable: newItemIsTaxable,
            };
            setLineItems([...lineItems, newItem]);
            setNewItemDesc('');
            setNewItemPrice('');
            setNewItemIsTaxable(true);
        }
    };
    const handleDeleteLineItem = (id: string) => {
        setLineItems(lineItems.filter(item => item.id !== id));
    };
    const handleToggleLineItemTaxable = (id: string) => {
        setLineItems(lineItems.map(item => 
            item.id === id ? { ...item, isTaxable: !item.isTaxable } : item
        ));
    };
    const handleSaveInvoiceSettings = async () => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userId, { 
                defaultInvoiceNotes: invoiceNotes,
                defaultPaymentDetails: paymentDetails,
                invoiceLineItems: lineItems,
                defaultTaxRate: Number(defaultTaxRate) || 0,
                sendOverdueReminders: profile.sendOverdueReminders || false
            });
            alert("Invoice settings saved!");
            router.refresh();
        } catch (error) {
            console.error("Error saving invoice settings:", error);
            alert("Failed to save invoice settings.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div>
                <header className="mb-6"><h1 className="text-3xl font-bold text-foreground">Settings</h1></header>

                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>My Profile</button>
                        <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Expenses</button>
                        <button onClick={() => setActiveTab('templates')} className={`${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Message Templates</button>
                        <button onClick={() => setActiveTab('invoicing')} className={`${activeTab === 'invoicing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Invoice Settings</button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'profile' && ( <ProfileForm initialProfile={profile} onSave={handleSaveProfile} isSubmitting={isSubmitting}/> )}
                    
                    {activeTab === 'expenses' && (
                        <div className="space-y-6 max-w-2xl">
                             <div>
                                <h2 className="text-xl font-semibold">Expense Categories</h2>
                                <p className="text-muted-foreground text-sm mt-1">Add, remove, or re-order your custom expense categories.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <div className="space-y-2">
                                    {expenseCategories.map((category, index) => (
                                        <div key={category} className="flex justify-between items-center bg-background p-2 rounded-md group">
                                            <span>{category}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0} className="p-1 rounded-full text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed"><ArrowUp size={16} /></button>
                                                <button onClick={() => handleMoveCategory(index, 'down')} disabled={index === expenseCategories.length - 1} className="p-1 rounded-full text-muted-foreground hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed"><ArrowDown size={16} /></button>
                                                {!DEFAULT_EXPENSE_CATEGORIES.includes(category) && (
                                                    <button onClick={() => handleDeleteCategory(category)} className="p-1 rounded-full text-muted-foreground hover:text-destructive ml-2"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2 bg-background border rounded-md" placeholder="Add new category name"/>
                                    <button onClick={handleAddCategory} className="bg-secondary text-secondary-foreground font-semibold p-2 rounded-lg hover:bg-secondary/80"><PlusCircle size={20} /></button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleSaveExpenseSettings} disabled={isSubmitting} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Expense Settings
                                </button>
                            </div>
                        </div>
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

                    {activeTab === 'invoicing' && (
                        <div className="space-y-8 max-w-4xl">
                            <div>
                                <h2 className="text-xl font-semibold">Invoice Defaults</h2>
                                <p className="text-muted-foreground text-sm mt-1">Set defaults that will appear on every new invoice.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-muted-foreground">Default Tax Rate (%)</label>
                                        <a 
                                            href="https://www.avalara.com/taxrates/en/state-rates.html" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary underline flex items-center gap-1"
                                        >
                                            <Info size={12} />
                                            Look up sales tax rates
                                        </a>
                                    </div>
                                    <input 
                                        id="defaultTaxRate"
                                        type="number" 
                                        value={defaultTaxRate} 
                                        onChange={(e) => setDefaultTaxRate(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full mt-1 p-2 bg-background border rounded-md" 
                                        placeholder="e.g., 7.25" step="0.01"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="sendOverdueReminders" 
                                        name="sendOverdueReminders"
                                        checked={profile.sendOverdueReminders || false} 
                                        onChange={(e) => setProfile(prev => ({ ...prev, sendOverdueReminders: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                                    />
                                    <label htmlFor="sendOverdueReminders" className="text-sm font-medium text-muted-foreground">
                                        Automatically send reminders for overdue invoices
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Notes / Terms & Conditions</label>
                                    <textarea value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} rows={5} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Default Payment Details</label>
                                    <textarea value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} rows={4} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                                </div>
                            </div>
                            <div className="pt-8 border-t">
                                <h2 className="text-xl font-semibold">Reusable Line Items</h2>
                                <p className="text-muted-foreground text-sm mt-1">Create a list of common services to quickly add them to new invoices.</p>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <div className="space-y-2">
                                    {lineItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={!!item.isTaxable} onChange={() => handleToggleLineItemTaxable(item.id)} className="cursor-pointer h-4 w-4" />
                                                <div>
                                                    <span>{item.description}</span>
                                                    <p className="text-xs text-muted-foreground">({item.isTaxable ? 'Taxable' : 'Non-Taxable'})</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">${item.unitPrice.toFixed(2)}</span>
                                                <button onClick={() => handleDeleteLineItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-full"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                    <input type="text" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="md:col-span-2 w-full p-2 bg-background border rounded-md" placeholder="New item description..."/>
                                    <input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 bg-background border rounded-md" placeholder="Price"/>
                                    <div className="flex items-center gap-2">
                                        <input id="isTaxable" type="checkbox" checked={newItemIsTaxable} onChange={(e) => setNewItemIsTaxable(e.target.checked)} className="h-4 w-4"/>
                                        <label htmlFor="isTaxable" className="text-sm">Taxable</label>
                                    </div>
                                    <button onClick={handleAddLineItem} className="md:col-span-4 w-full mt-2 bg-secondary text-secondary-foreground font-semibold p-2 rounded-lg hover:bg-secondary/80 flex items-center justify-center gap-2">
                                        <PlusCircle size={20} /> Add Item
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-6">
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