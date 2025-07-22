"use client";

import { useState, useEffect, Suspense } from 'react';
// ✅ Import useSearchParams to read from the URL
import { useRouter, useSearchParams } from 'next/navigation';
import type { Client } from '@/types/app-interfaces';
import { addClient } from '@/utils/firestoreService';
import ClientForm from '@/components/ClientForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

// ✅ We need an inner component to use the searchParams hook
function NewCompanyPageInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<Partial<Client> | undefined>();

    useEffect(() => {
        // Check if there's pre-filled data in the URL
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const parsedData = JSON.parse(decodeURIComponent(dataParam));
                setInitialData(parsedData);
            } catch (error) {
                console.error("Failed to parse duplicate data:", error);
            }
        }
    }, [searchParams]);

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
                initialData={initialData}
                onSave={handleSave}
                onCancel={() => router.push('/dashboard/clients')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

// ✅ The main export now wraps our component in Suspense, which is required by Next.js for useSearchParams
export default function NewCompanyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <NewCompanyPageInternal />
        </Suspense>
    );
}