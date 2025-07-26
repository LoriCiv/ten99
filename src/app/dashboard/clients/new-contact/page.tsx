"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PersonalNetworkContact, Client } from '@/types/app-interfaces';
import { addPersonalNetworkContact, getClients } from '@/utils/firestoreService';
import ContactForm from '@/components/ContactForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/nextjs'; // ✅ 1. Import useAuth

export default function NewContactPage() {
    const router = useRouter();
    const { userId } = useAuth(); // ✅ 2. Get the real userId
    const [clients, setClients] = useState<Client[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userId) {
            const unsub = getClients(userId, setClients);
            return () => unsub();
        }
    }, [userId]);

    const handleSave = async (formData: Partial<PersonalNetworkContact>) => {
        if (!userId) {
            alert("You must be logged in to create a contact.");
            return;
        }
        setIsSubmitting(true);
        try {
            // ✅ 3. Use the real userId to save the new contact
            await addPersonalNetworkContact(userId, formData);
            alert("Contact created successfully!");
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error saving contact:", error);
            alert("Failed to save contact.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userId) {
        return <div className="p-8 text-center">Loading user...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/clients" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients & Connections
            </Link>
            <ContactForm
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
                clients={clients}
            />
        </div>
    );
}