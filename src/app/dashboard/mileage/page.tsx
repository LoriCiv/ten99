"use client";

import { useState, useEffect } from 'react';
import type { Mileage } from '@/types/app-interfaces';
import { getMileage, addMileage, deleteMileage } from '@/utils/firestoreService';
import { Map, PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const TEMP_USER_ID = "dev-user-1";

export default function MileagePage() {
    const [mileageEntries, setMileageEntries] = useState<Mileage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newEntry, setNewEntry] = useState<Partial<Mileage>>({
        date: new Date().toISOString().split('T')[0],
        miles: 0,
        purpose: '',
    });

    useEffect(() => {
        const unsubscribe = getMileage(TEMP_USER_ID, setMileageEntries);
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setNewEntry(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.date || !newEntry.miles || !newEntry.purpose) {
            alert("Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addMileage(TEMP_USER_ID, newEntry);
            setNewEntry({
                date: new Date().toISOString().split('T')[0],
                miles: 0,
                purpose: '',
                startLocation: '',
                endLocation: '',
                notes: ''
            });
        } catch (error) {
            console.error("Failed to save mileage:", error);
            alert("Failed to save mileage.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            await deleteMileage(TEMP_USER_ID, id);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Mileage Tracker</h1>
                <p className="text-muted-foreground mt-1">Log your work-related trips for tax deductions.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSave} className="bg-card p-6 rounded-lg border space-y-4">
                        <h3 className="text-lg font-semibold">Log a New Trip</h3>
                        <div>
                            <label className="text-sm font-medium">Date*</label>
                            <input type="date" name="date" value={newEntry.date} onChange={handleInputChange} required className="w-full mt-1 p-2 bg-background border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Total Miles*</label>
                            <input type="number" name="miles" value={newEntry.miles || ''} onChange={handleInputChange} required className="w-full mt-1 p-2 bg-background border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Purpose*</label>
                            <input type="text" name="purpose" value={newEntry.purpose} onChange={handleInputChange} required placeholder="e.g., Client Meeting at ABC Corp" className="w-full mt-1 p-2 bg-background border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Start Location</label>
                            <input type="text" name="startLocation" value={newEntry.startLocation || ''} onChange={handleInputChange} placeholder="e.g., Office" className="w-full mt-1 p-2 bg-background border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">End Location</label>
                            <input type="text" name="endLocation" value={newEntry.endLocation || ''} onChange={handleInputChange} placeholder="e.g., 123 Main St, Anytown" className="w-full mt-1 p-2 bg-background border rounded-md" />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                            {isSubmitting ? 'Saving...' : 'Add Trip'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-card p-6 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Recent Trips</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {mileageEntries.map(entry => (
                                <div key={entry.id} className="flex justify-between items-center p-3 bg-background rounded-md border">
                                    <div>
                                        <p className="font-semibold">{format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')} - {entry.purpose}</p>
                                        <p className="text-sm text-muted-foreground">{entry.miles} miles</p>
                                    </div>
                                    <button onClick={() => handleDelete(entry.id!)} className="p-2 text-muted-foreground hover:text-destructive rounded-md">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {mileageEntries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No mileage logged yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}