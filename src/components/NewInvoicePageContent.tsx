"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import { getClients, getUserProfile, getNextInvoiceNumber, addInvoice } from '@/utils/firestoreService';
import InvoiceForm from '@/components/InvoiceForm';

interface NewInvoicePageContentProps {
    userId: string;
}

function NewInvoicePageContent({ userId }: NewInvoicePageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [clients, setClients] = useState<Client[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [nextInvoiceNum, setNextInvoiceNum] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const appointmentId = searchParams.get('appointmentId');
    const initialData = appointmentId ? { appointmentId } : {};

    useEffect(() => {
        if (userId) {
            const unsubClients = getClients(userId, setClients);
            const unsubProfile = getUserProfile(userId, setUserProfile);
            getNextInvoiceNumber(userId).then(num => {
                setNextInvoiceNum(num);
                setIsLoading(false);
            });
            return () => { unsubClients(); unsubProfile(); };
        }
    }, [userId]);

    const handleSave = async (data: Partial<Invoice>) => {
        if (!userId) {
            alert("You must be logged in to create an invoice.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addInvoice(userId, { ...data, invoiceNumber: nextInvoiceNum });
            alert("Invoice saved!");
            router.push('/dashboard/invoices');
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Failed to save invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
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
            />
        </div>
    );
}

// Wrapper component to handle Suspense for search params
export default function NewInvoicePageWrapper({ userId }: { userId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <NewInvoicePageContent userId={userId} />
        </Suspense>
    );
}