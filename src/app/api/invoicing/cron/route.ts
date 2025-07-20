// src/app/api/invoicing/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { createInvoiceFromAppointment } from '@/utils/firestoreService'; // We need to import our function
import type { Appointment, Invoice } from '@/types/app-interfaces';

// IMPORTANT: This function will only be called by Vercel on a schedule in production.
export async function GET(request: Request) {
    // Security check to ensure only Vercel can run this
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('Running hourly invoice generation cron job...');
    const TEMP_USER_ID = "dev-user-1"; // For now, we are targeting our single user

    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // 1. Get all completed appointments that ended in the last hour
        const appointmentsSnapshot = await db.collection(`users/${TEMP_USER_ID}/appointments`)
            .where('status', '==', 'completed')
            .get();
        
        const completedAppointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

        // 2. Get all existing invoices to check for duplicates
        const invoicesSnapshot = await db.collection(`users/${TEMP_USER_ID}/invoices`).get();
        const existingInvoiceAppointmentIds = new Set(invoicesSnapshot.docs.map(doc => (doc.data() as Invoice).appointmentId));

        let invoicesCreated = 0;
        for (const appt of completedAppointments) {
            // 3. Check if an invoice already exists for this appointment
            if (!existingInvoiceAppointmentIds.has(appt.id)) {
                console.log(`Creating invoice for completed appointment: ${appt.id}`);
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