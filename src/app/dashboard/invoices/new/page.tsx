// src/app/dashboard/invoices/new/page.tsx
"use client";

// ✅ Removed unused 'useCallback' from this import
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Invoice, Client, Appointment, UserProfile } from '@/types/app-interfaces';
import { getClients, getAppointments, addInvoice, getUserProfile, getNextInvoiceNumber } from '@/utils/firestoreService';
import InvoiceForm from '@/components/InvoiceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

// ... rest of the file is unchanged
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
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');

    useEffect(() => {
        let profileLoaded = false;
        let clientsLoaded = false;
        let appointmentsLoaded = false;

        const checkLoadingState = () => {
            if (profileLoaded && clientsLoaded && appointmentsLoaded) {
                // This will be handled by the next useEffect
            }
        };

        const unsubClients = getClients(TEMP_USER_ID, (data) => {
            setClients(data);
            clientsLoaded = true;
            checkLoadingState();
        });
        const unsubAppointments = getAppointments(TEMP_USER_ID, (data) => {
            setAppointments(data);
            appointmentsLoaded = true;
            checkLoadingState();
        });
        const unsubProfile = getUserProfile(TEMP_USER_ID, (profile) => {
            setUserProfile(profile);
            profileLoaded = true;
            checkLoadingState();
        });
        
        getNextInvoiceNumber(TEMP_USER_ID).then(setNextInvoiceNumber);

        return () => { unsubClients(); unsubAppointments(); unsubProfile(); };
    }, []);

    useEffect(() => {
        // This effect runs once all the data is available
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
            setIsLoading(false); // Only stop loading when everything is processed
        } else if (userProfile) { // Handle case with no clients/appointments
             setIsLoading(false);
        }
    }, [clients, appointments, userProfile, searchParams]);

    const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
        setIsSubmitting(true);
        try {
            const finalInvoiceData = { ...invoiceData, lineItems: invoiceData.lineItems?.filter(item => item.description.trim() !== '') };
            await addInvoice(TEMP_USER_ID, { ...finalInvoiceData, invoiceNumber: nextInvoiceNumber });
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
                nextInvoiceNumber={nextInvoiceNumber}
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