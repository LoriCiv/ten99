// src/components/MileagePageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import type { Mileage } from '@/types/app-interfaces';
import { getMileage, addMileage, deleteMileage } from '@/utils/firestoreService';
import { PlusCircle, Trash2, Loader2, ThumbsUp, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { useFirebase } from './FirebaseProvider';

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

export default function MileagePageContent({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase();
    const [mileageEntries, setMileageEntries] = useState<Mileage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newEntry, setNewEntry] = useState<Partial<Mileage>>({
        date: new Date().toISOString().split('T')[0],
        miles: 0,
        purpose: '',
        startLocation: '',
        endLocation: '',
        notes: '',
    });

    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        if (isFirebaseAuthenticated) {
            const unsubscribe = getMileage(userId, (data) => {
                setMileageEntries(data);
                setIsLoading(false);
            });
            return () => unsubscribe();
        }
    }, [isFirebaseAuthenticated, userId]);

    const showStatusMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setNewEntry(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFirebaseAuthenticated) {
            showStatusMessage("error", "You must be logged in to save mileage.");
            return;
        }
        if (!newEntry.date || !newEntry.miles || !newEntry.purpose) {
            showStatusMessage("error", "Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addMileage(userId, newEntry);
            showStatusMessage("success", "Trip logged successfully!");
            
            // ✅ This now correctly clears all fields after saving.
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
            showStatusMessage("error", "Failed to save mileage.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = (id: string) => {
        if (!isFirebaseAuthenticated) {
            showStatusMessage("error", "You must be logged in to delete mileage.");
            return;
        }
        setConfirmation({
            title: "Delete Mileage Entry?",
            message: "Are you sure you want to delete this trip log?",
            onConfirm: async () => {
                try {
                    await deleteMileage(userId, id);
                    showStatusMessage("success", "Trip deleted.");
                } catch (error) {
                    console.error("Error deleting mileage:", error);
                    showStatusMessage("error", "Failed to delete trip.");
                }
                setConfirmation(null);
            }
        });
    };

    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-lg font-semibold mt-4">Loading Mileage Tracker...</p>
                    <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching your data...</p>
               </div>
            </div>
        );
    }

    return (
        <>
            {confirmation && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation(null)} />}
            {statusMessage && (
                <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {statusMessage.type === 'success' ? <ThumbsUp size={20} /> : <Info size={20} />}
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10"><X size={16}/></button>
                </div>
            )}
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Mileage Tracker</h1>
                    <p className="text-muted-foreground mt-1">Log your work-related trips for tax deductions.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <form onSubmit={handleSave} className="bg-card p-6 rounded-lg border space-y-4">
                            <h3 className="text-lg font-semibold">Log a New Trip</h3>
                            <div>
                                <label className="text-sm font-medium">Date*</label>
                                <input type="date" name="date" value={newEntry.date} onChange={handleInputChange} required className="w-full mt-1 p-2 bg-background border rounded-md" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Total Miles*</label>
                                <input type="number" name="miles" value={newEntry.miles || ''} onChange={handleInputChange} required className="w-full mt-1 p-2 bg-background border rounded-md" step="0.1" />
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
                            <div>
                                <label className="text-sm font-medium">Notes</label>
                                <textarea name="notes" value={newEntry.notes || ''} onChange={handleInputChange} placeholder="Additional details..." rows={3} className="w-full mt-1 p-2 bg-background border rounded-md resize-none" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                                {isSubmitting ? 'Saving...' : 'Add Trip'}
                            </button>
                        </form>
                    </div>

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
        </>
    );
}