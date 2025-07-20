// src/app/api/invoicing/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { createInvoiceFromAppointment } from '@/utils/firestoreService';
import type { Appointment, Invoice } from '@/types/app-interfaces';

const TEMP_USER_ID = "dev-user-1";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('Running hourly invoice generation cron job...');

    try {
        // 1. Get all appointments that are marked as "completed"
        const appointmentsSnapshot = await db.collection(`users/${TEMP_USER_ID}/appointments`)
            .where('status', '==', 'completed')
            .get();
        
        const completedAppointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

        if (completedAppointments.length === 0) {
            const message = "Cron job finished. No completed appointments found to invoice.";
            console.log(message);
            return NextResponse.json({ message });
        }

        // 2. Get all existing invoices to check for duplicates
        const invoicesSnapshot = await db.collection(`users/${TEMP_USER_ID}/invoices`).get();
        const existingInvoiceAppointmentIds = new Set(invoicesSnapshot.docs.map(doc => (doc.data() as Invoice).appointmentId));

        let invoicesCreated = 0;
        for (const appt of completedAppointments) {
            // 3. Check if an invoice already exists for this appointment
            if (appt.id && !existingInvoiceAppointmentIds.has(appt.id)) {
                console.log(`Creating invoice for completed appointment: ${appt.id}`);
                // Use the existing, powerful function from firestoreService to create the invoice
                await createInvoiceFromAppointment(TEMP_USER_ID, appt);
                invoicesCreated++;
            }
        }

        const message = `Cron job finished. Created ${invoicesCreated} new invoices.`;
        console.log(message);
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Cron job failed:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
}