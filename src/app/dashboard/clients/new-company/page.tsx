// src/app/dashboard/clients/new-company/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/app-interfaces';
import { addClient } from '@/utils/firestoreService';
import ClientForm from '@/components/ClientForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react'; // ✅ THE FIX: Removed unused 'Save' icon

const TEMP_USER_ID = "dev-user-1";

export default function NewCompanyPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: Partial<Client>) => {
        setIsSubmitting(true);
        try {
            await addClient(TEMP_USER_ID, data);
            alert('Company added successfully!');
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Error adding company:", error);
            alert('Failed to add company.');
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
            <ClientForm
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}