// src/app/dashboard/invoices/new/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Invoice, Client, Appointment, UserProfile } from '@/types/app-interfaces';
// ✅ THE FIX: Removed getNextInvoiceNumber from the import
import { getClients, getAppointments, addInvoice, getUserProfile } from '@/utils/firestoreService';
import InvoiceForm from '@/components/InvoiceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

const calculateDurationInHours = (startTime?: string, endTime?: string): number => {
    if (!startTime || !endTime) return 1;
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 1;
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

function NewInvoicePageInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<Partial<Invoice> | undefined>();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const fetchData = useCallback(() => {
        getClients(TEMP_USER_ID, setClients);
        getAppointments(TEMP_USER_ID, setAppointments);
        getUserProfile(TEMP_USER_ID, setUserProfile);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (clients.length > 0 && appointments.length > 0 && userProfile) {
            const appointmentId = searchParams.get('appointmentId');
            const prefilledData: Partial<Invoice> = {
                notes: userProfile.defaultInvoiceNotes || '',
                paymentDetails: userProfile.defaultPaymentDetails || '',
                lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
            };
            if (appointmentId) {
                const linkedAppointment = appointments.find(a => a.id === appointmentId);
                const linkedClient = clients.find(c => c.id === linkedAppointment?.clientId);
                if (linkedAppointment && linkedClient) {
                    const rate = linkedClient.rate || 0;
                    const duration = calculateDurationInHours(linkedAppointment.time, linkedAppointment.endTime);
                    const detailedDescription = `${linkedAppointment.subject || 'Services Rendered'}\nDate: ${linkedAppointment.date}`;
                    prefilledData.clientId = linkedAppointment.clientId;
                    prefilledData.lineItems = [{ description: detailedDescription, quantity: duration, unitPrice: rate, total: duration * rate }];
                }
            }
            setInitialData(prefilledData);
            setIsLoading(false);
        }
    }, [clients, appointments, userProfile, searchParams]);

    const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
        setIsSubmitting(true);
        try {
            await addInvoice(TEMP_USER_ID, invoiceData);
            alert("Invoice saved as draft!");
            router.push('/dashboard/invoices');
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Failed to save invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !userProfile) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/invoices" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
            </Link>
            <InvoiceForm
                onSave={handleSaveInvoice}
                onCancel={() => router.push('/dashboard/invoices')}
                clients={clients}
                isSubmitting={isSubmitting}
                initialData={initialData}
                userProfile={userProfile}
            />
        </div>
    );
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <NewInvoicePageInternal />
        </Suspense>
    );
}