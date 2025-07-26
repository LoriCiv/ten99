"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Mileage } from '@/types/app-interfaces';
import { addMileage, deleteMileage } from '@/utils/firestoreService';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MileageFormModalProps {
    userId: string;
    onClose: () => void;
    initialMileage: Mileage[];
}

export default function MileageFormModal({ userId, onClose, initialMileage }: MileageFormModalProps) {
    const router = useRouter();
    const [mileageEntries, setMileageEntries] = useState<Mileage[]>(initialMileage);
    const [newEntry, setNewEntry] = useState<Partial<Mileage>>({
        date: new Date().toISOString().split('T')[0],
        miles: 0,
        purpose: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: name === 'miles' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.date || !newEntry.miles || !newEntry.purpose) {
            alert("Date, Miles, and Purpose are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = await addMileage(userId, newEntry);
            const addedEntry = { id: docRef.id, ...newEntry } as Mileage;
            setMileageEntries(prev => [addedEntry, ...prev]);
            setNewEntry({ date: new Date().toISOString().split('T')[0], miles: 0, purpose: '' });
        } catch (error) {
            console.error("Failed to add mileage:", error);
            alert("Failed to log trip.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this trip?")) {
            try {
                await deleteMileage(userId, id);
                setMileageEntries(prev => prev.filter(entry => entry.id !== id));
            } catch (error) {
                console.error("Failed to delete mileage:", error);
                alert("Failed to delete trip.");
            }
        }
    };

    return (
        <div className="p-6">
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
    );
}
