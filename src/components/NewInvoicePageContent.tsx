// src/components/NewInvoicePageContent.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { getClients, getUserProfile, getNextInvoiceNumber, addInvoice } from '@/utils/firestoreService';
import InvoiceForm from '@/components/InvoiceForm';
import { useFirebase } from './FirebaseProvider'; // ✅ 1. Import our hook
import { Loader2 } from 'lucide-react';

interface NewInvoicePageContentProps {
    userId: string;
}

// This component can directly use useSearchParams because the page provides the <Suspense> boundary
export default function NewInvoicePageContent({ userId }: NewInvoicePageContentProps) {
    const { isFirebaseAuthenticated } = useFirebase(); // ✅ 2. Get the "Green Light"
    const router = useRouter();
    const searchParams = useSearchParams();

    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [nextInvoiceNum, setNextInvoiceNum] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const appointmentId = searchParams.get('appointmentId');
    const initialData = appointmentId ? { appointmentId } : {};

    // ✅ 3. This useEffect now waits for the Green Light before fetching data
    useEffect(() => {
        if (isFirebaseAuthenticated) {
            console.log("✅ New Invoice form is authenticated, fetching data...");
            const unsubClients = getClients(userId, setClients);
            const unsubProfile = getUserProfile(userId, setUserProfile);
            
            // This is a one-time fetch, not a listener
            getNextInvoiceNumber(userId).then(num => {
                setNextInvoiceNum(num);
                setIsLoading(false); // Stop loading once all async data is here
            });
            
            return () => { 
                unsubClients(); 
                unsubProfile(); 
            };
        }
    }, [isFirebaseAuthenticated, userId]);

    const handleSave = async (data: Partial<Invoice>) => {
        if (!isFirebaseAuthenticated) {
            setStatusMessage("Authentication error. Please wait and try again.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            await addInvoice(userId, { ...data, invoiceNumber: nextInvoiceNum });
            // We'll navigate away on success instead of using alert()
            router.push('/dashboard/invoices');
        } catch (error) {
            console.error("Error saving invoice:", error);
            setStatusMessage("Failed to save invoice. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // ✅ 4. Show a loading indicator until Firebase is ready AND data is loaded
    if (!isFirebaseAuthenticated || isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Invoice Form...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating and fetching initial data...</p>
               </div>
           </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <InvoiceForm
                initialData={initialData}
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/invoices')}
                clients={clients}
                isSubmitting={isSubmitting}
                userProfile={userProfile}
                nextInvoiceNumber={nextInvoiceNum}
                statusMessage={statusMessage} // Pass status message to the form
            />
        </div>
    );
}