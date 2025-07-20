// src/app/dashboard/clients/new-contact/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonalNetworkContact, Client } from '@/types/app-interfaces';
import { addPersonalNetworkContact, getClients } from '@/utils/firestoreService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

const TEMP_USER_ID = "dev-user-1";

export default function NewContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        // Fetch clients so we can link a contact to a company
        const unsubscribe = getClients(TEMP_USER_ID, setClients);
        return () => unsubscribe();
    }, []);

    const handleSaveContact = async (formData: Partial<PersonalNetworkContact>) => {
        setIsSubmitting(true);
        try {
            await addPersonalNetworkContact(TEMP_USER_ID, formData);
            alert("Contact created successfully!");
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error creating contact:", error);
            alert("Failed to create contact.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/clients" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients & Connections
            </Link>
            <ContactForm
                onSave={handleSaveContact}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
                clients={clients}
            />
        </div>
    );
}