// src/components/ExpenseForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Expense, Client, UserProfile } from '@/types/app-interfaces';
import { uploadFile } from '@/utils/firestoreService';
import { Loader2, Save, Paperclip, Sparkles } from 'lucide-react';

interface ExpenseFormProps {
    onSave: (data: Partial<Expense>) => Promise<void>;
    onCancel: () => void;
    clients: Client[];
    initialData?: Partial<Expense>;
    isSubmitting: boolean;
    userId: string;
    userProfile: UserProfile | null;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export default function ExpenseForm({ onSave, onCancel, clients, initialData = {}, isSubmitting, userId, userProfile }: ExpenseFormProps) {
    const isEditMode = !!initialData?.id;
    
    const [formData, setFormData] = useState<Partial<Expense>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [aiMessage, setAiMessage] = useState('');

    useEffect(() => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            category: userProfile?.expenseCategories?.[0]?.toLowerCase().replace(/\s/g, '_') || 'other',
            ...initialData,
        });
        setSelectedFile(null);
        setAiMessage('');
    }, [initialData, userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setAiMessage('');
        }
    };

    const handleParseReceipt = async () => {
        if (!selectedFile) return;
        
        setIsParsing(true);
        setAiMessage("AI is reading your receipt...");

        try {
            const base64Image = await toBase64(selectedFile);
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            
            const payload = {
                contents: [{
                    parts: [
                        { text: "Analyze this receipt image and extract the vendor name (for 'description'), the final total amount (for 'amount'), and the transaction date (in YYYY-MM-DD format for 'date'). Respond ONLY with a valid JSON object like this: {\"description\": \"Vendor Name\", \"amount\": 12.34, \"date\": \"YYYY-MM-DD\"}" },
                        { inline_data: { mime_type: selectedFile.type, data: base64Image } }
                    ]
                }]
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("AI API request failed.");

            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(text);
            
            setFormData(prev => ({
                ...prev,
                description: parsed.description || prev.description,
                amount: parsed.amount || prev.amount,
                date: parsed.date || prev.date,
            }));
            setAiMessage("Receipt parsed successfully!");
        } catch (error) {
            console.error("AI Receipt Parsing Error:", error);
            setAiMessage("Sorry, I couldn't read that receipt.");
        } finally {
            setIsParsing(false);
        }
    };

    // This useEffect hook now automatically runs the AI parser when a file is selected.
    useEffect(() => {
        if (selectedFile) {
            handleParseReceipt();
        }
    }, [selectedFile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalData = { ...formData };
        if (selectedFile) {
            try {
                const receiptUrl = await uploadFile(userId, selectedFile);
                finalData.receiptUrl = receiptUrl;
            } catch (error) {
                console.error("Receipt upload failed:", error);
                alert("Receipt upload failed. The expense was not saved.");
                return;
            }
        }
        await onSave(finalData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
            <h3 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Expense' : 'Add New Expense'}</h3>
            
            <div>
                <label className="block text-sm font-medium text-muted-foreground">Scan Receipt with AI</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="file" onChange={handleFileChange} accept="image/*" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </div>
                {isParsing && <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> {aiMessage}</p>}
                {!isParsing && aiMessage && <p className="text-xs text-muted-foreground mt-2 text-center">{aiMessage}</p>}
                {formData.receiptUrl && !selectedFile && (
                    <a href={formData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                        <Paperclip size={12}/> View Existing Receipt
                    </a>
                )}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">Description*</label>
                <input id="description" name="description" type="text" value={formData.description || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="e.g., Office Supplies" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground">Amount*</label>
                    <input id="amount" name="amount" type="number" value={formData.amount || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="0.00" required step="0.01" />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-muted-foreground">Date*</label>
                    <input id="date" name="date" type="date" value={formData.date || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                </div>
            </div>

            <div>
                <label htmlFor="category" className="block text-sm font-medium text-muted-foreground">Category*</label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background" required>
                    {(userProfile?.expenseCategories && userProfile.expenseCategories.length > 0 ? userProfile.expenseCategories : ['Travel', 'Equipment', 'Supplies', 'Professional Development', 'Other'])
                        .map((cat: string) => (
                            <option key={cat} value={cat.toLowerCase().replace(/\s/g, '_')}>{cat}</option>
                        ))
                    }
                </select>
            </div>
            
            <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-muted-foreground">Link to Client (Optional)</label>
                <select id="clientId" name="clientId" value={formData.clientId || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-background">
                    <option value="">None</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id!}>{client.companyName || client.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-muted-foreground">Notes (Optional)</label>
                <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border rounded-md" placeholder="Add any relevant notes..."></textarea>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">Cancel</button>
                <button type="submit" disabled={isSubmitting || isParsing} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 w-36 justify-center">
                    {isSubmitting || isParsing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSubmitting ? 'Saving...' : isParsing ? 'Parsing...' : 'Save Expense'}
                </button>
            </div>
        </form>
    );
}