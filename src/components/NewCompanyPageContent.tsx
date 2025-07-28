// src/components/NewCompanyPageContent.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/app-interfaces';
import { addClient } from '@/utils/firestoreService';
import ClientForm from '@/components/ClientForm'; // We assume you have a reusable form component
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider'; // Import our hook

export default function NewCompanyPageContent({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase(); // Get the "Green Light"
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleSave = async (formData: Partial<Client>) => {
        if (!isFirebaseAuthenticated) {
            setStatusMessage("Authentication error. Please wait a moment and try again.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            // Ensure the clientType is set correctly for a company
            await addClient(userId, { ...formData, clientType: 'business_1099' });
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error saving company:", error);
            setStatusMessage("Failed to save company. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show a loading state until we have the "Green Light" from Firebase
    if (!isFirebaseAuthenticated) {
        return (
            <div className="flex justify-center items-center h-full p-8">
               <div className="text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                   <p className="text-lg font-semibold mt-4">Loading Form...</p>
                   <p className="text-muted-foreground text-sm mt-1">Authenticating...</p>
               </div>
           </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <Link href="/dashboard/clients" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
            </Link>
            {/* We will need to make sure ClientForm exists and accepts these props */}
            <ClientForm
                formType="company"
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
                statusMessage={statusMessage}
            />
        </div>
    );
}