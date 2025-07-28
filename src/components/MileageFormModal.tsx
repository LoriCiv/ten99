// src/components/MileageFormModal.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Mileage } from '@/types/app-interfaces';
import { addMileage, deleteMileage } from '@/utils/firestoreService';
import { PlusCircle, Trash2, Loader2, Info, ThumbsUp, X as XIcon } from 'lucide-react';
import { format } from 'date-fns';

// ✅ New component for confirmation dialogs
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-md border p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground my-4">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-muted text-muted-foreground font-semibold py-2 px-4 rounded-lg hover:bg-muted/80">Cancel</button>
                <button onClick={onConfirm} className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90">Confirm</button>
            </div>
        </div>
    </div>
);


interface MileageFormModalProps {
    userId: string;
    onClose: () => void;
    initialMileage: Mileage[];
}

export default function MileageFormModal({ userId, onClose, initialMileage }: MileageFormModalProps) {
    const [mileageEntries, setMileageEntries] = useState<Mileage[]>(initialMileage);
    const [newEntry, setNewEntry] = useState<Partial<Mileage>>({
        date: new Date().toISOString().split('T')[0],
        miles: 0,
        purpose: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // This effect keeps the local state in sync if the initial props change
    useEffect(() => {
        setMileageEntries(initialMileage);
    }, [initialMileage]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: name === 'miles' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage(null);
        if (!newEntry.date || !newEntry.miles || !newEntry.purpose) {
            showStatusMessage("error", "Date, Miles, and Purpose are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = await addMileage(userId, newEntry);
            // Firestore listeners on the parent page will handle the update,
            // so we don't need to manually update state here.
            showStatusMessage("success", "Trip logged successfully!");
            setNewEntry({ date: new Date().toISOString().split('T')[0], miles: 0, purpose: '' });
        } catch (error) {
            console.error("Failed to add mileage:", error);
            showStatusMessage("error", "Failed to log trip.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!id) return;
        setConfirmation({
            title: "Delete Trip?",
            message: "Are you sure you want to delete this mileage entry?",
            onConfirm: async () => {
                try {
                    await deleteMileage(userId, id);
                    // The parent component's listener will update the list
                    showStatusMessage("success", "Trip deleted.");
                } catch (error) {
                    console.error("Failed to delete mileage:", error);
                    showStatusMessage("error", "Failed to delete trip.");
                }
                setConfirmation(null);
            }
        });
    };

    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            <div className="p-6 relative">
                {statusMessage && (
                    <div className={`absolute top-6 right-6 z-50 p-3 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.type === 'success' ? <ThumbsUp size={16} /> : <Info size={16} />}
                        <span className="text-sm font-semibold">{statusMessage.text}</span>
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-6">Mileage Log</h2>
                <form onSubmit={handleSubmit} className="bg-muted/50 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
                    <div>
                        <label className="block text-sm font-medium">Date*</label>
                        <input type="date" name="date" value={newEntry.date} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Miles*</label>
                        <input type="number" name="miles" value={newEntry.miles || ''} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Purpose*</label>
                        <input type="text" name="purpose" value={newEntry.purpose} onChange={handleInputChange} placeholder="e.g., Client Meeting in Atlanta" className="w-full mt-1 p-2 bg-background border rounded-md" required />
                    </div>
                    <div className="md:col-span-4">
                         <label className="block text-sm font-medium">Notes</label>
                        <textarea name="notes" value={newEntry.notes || ''} onChange={handleInputChange} rows={2} className="w-full mt-1 p-2 bg-background border rounded-md"></textarea>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                            Log Trip
                        </button>
                    </div>
                </form>

                <h3 className="text-lg font-semibold mb-4">Logged Trips</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {mileageEntries.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center bg-background p-3 rounded-md border">
                            <div>
                                <p className="font-semibold">{entry.purpose}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')} - {entry.miles} miles</p>
                            </div>
                            <button onClick={() => handleDelete(entry.id!)} className="text-muted-foreground hover:text-destructive p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {mileageEntries.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-8">No mileage logged yet.</p>
                    )}
                </div>
            </div>
        </>
    );
}