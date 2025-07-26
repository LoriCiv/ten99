"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Client } from '@/types/app-interfaces';
import { addClient } from '@/utils/firestoreService';
import ClientForm from '@/components/ClientForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/nextjs'; // ✅ 1. Import useAuth

function NewCompanyPageInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userId } = useAuth(); // ✅ 2. Get the real userId
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dataString = searchParams.get('data');
    const initialData = dataString ? JSON.parse(decodeURIComponent(dataString)) : {};

    const handleSave = async (formData: Partial<Client>) => {
        if (!userId) { // Safety check
            alert("You must be logged in to create a client.");
            return;
        }
        setIsSubmitting(true);
        try {
            // ✅ 3. Use the real userId to save the new client
            await addClient(userId, formData);
            alert("Company created successfully!");
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error saving company:", error);
            alert("Failed to save company.");
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
                Back to Clients
            </Link>
            <ClientForm
                initialData={initialData}
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

export default function NewCompanyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <NewCompanyPageInternal />
        </Suspense>
    );
}