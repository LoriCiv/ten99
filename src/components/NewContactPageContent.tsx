// src/components/NewContactPageContent.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/app-interfaces';
import { addClient } from '@/utils/firestoreService';
import ClientForm from '@/components/ClientForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

export default function NewContactPageContent({ userId }: { userId: string }) {
    const { isFirebaseAuthenticated } = useFirebase();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleSave = async (formData: Partial<Client>) => {
        if (!isFirebaseAuthenticated) {
            setStatusMessage("Authentication error. Please wait and try again.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            // We ensure the clientType is set to 'individual' for this form
            await addClient(userId, { ...formData, clientType: 'individual' });
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error saving contact:", error);
            setStatusMessage("Failed to save contact. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <ClientForm
                formType="contact" // We tell our smart form to be in 'contact' mode
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
                statusMessage={statusMessage}
            />
        </div>
    );
}