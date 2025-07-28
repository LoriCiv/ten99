// src/app/api/appointments/cron/route.ts

import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin'; // ✅ 1. Import our new helper
import { getFirestore, FieldValue, Transaction } from 'firebase-admin/firestore'; // ✅ 2. Import firestore components
import type { Appointment, Client, Invoice } from '@/types/app-interfaces';

// Helper function to calculate duration (server-side version)
const calculateDurationInHours = (startTime?: string, endTime?: string): number => {
    if (!startTime || !endTime) return 1;
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 1;
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

// Helper function to get next invoice number (server-side version)
const generateNextInvoiceNumber = async (userId: string): Promise<string> => {
    const db = getFirestore(); // Get db instance
    const metaRef = db.doc(`users/${userId}/_metadata/invoiceCounter`);
    const year = new Date().getFullYear();
    
    // ✅ 3. Add the correct type for 'transaction'
    return db.runTransaction(async (transaction: Transaction) => {
        const metaDoc = await transaction.get(metaRef);
        const data = metaDoc.data();

        if (!metaDoc.exists || !data) {
            transaction.set(metaRef, { lastNumber: 1, year: year });
            return `${year}-001`;
        }
        
        const lastNumber = data.year === year ? data.lastNumber : 0;
        const nextNumber = lastNumber + 1;
        transaction.update(metaRef, { lastNumber: nextNumber, year: year });
        return `${year}-${String(nextNumber).padStart(3, '0')}`;
    });
};

export async function GET() {
    try {
        initializeFirebaseAdmin(); // ✅ 4. Initialize Firebase Admin at the start
        const db = getFirestore(); // ✅ 5. Get the db instance to use

        const today = new Date().toISOString().split('T')[0];
        const appointmentsRef = db.collectionGroup('appointments');
        const q = appointmentsRef.where('status', '==', 'scheduled').where('date', '<', today);

        const snapshot = await q.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No appointments to mark as completed.' });
        }

        let completedCount = 0;
        let invoicesCreated = 0;

        for (const doc of snapshot.docs) {
            const appointment = { id: doc.id, ...doc.data() } as Appointment;
            const appointmentRef = doc.ref;
            const userId = appointmentRef.parent.parent?.id;

            if (userId && appointment.eventType === 'job' && appointment.clientId) {
                const clientRef = db.doc(`users/${userId}/clients/${appointment.clientId}`);
                const clientSnap = await clientRef.get();

                if (clientSnap.exists) {
                    const client = clientSnap.data() as Client;
                    const rate = client.rate || 0;
                    const duration = calculateDurationInHours(appointment.time, appointment.endTime);
                    const total = duration * rate;

                    const nextInvoiceNumber = await generateNextInvoiceNumber(userId);
                    const invoiceData: Omit<Invoice, 'id'> = {
                        userId: userId,
                        invoiceNumber: nextInvoiceNumber,
                        clientId: appointment.clientId,
                        appointmentId: appointment.id,
                        invoiceDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'draft',
                        lineItems: [{
                            description: `${appointment.subject || 'Services Rendered'}\nDate: ${appointment.date}`,
                            quantity: duration,
                            unitPrice: rate,
                            total: total,
                            isTaxable: true
                        }],
                        subtotal: total,
                        tax: 0,
                        total: total,
                        createdAt: FieldValue.serverTimestamp()
                    };

                    const batch = db.batch();
                    const newInvoiceRef = db.collection(`users/${userId}/invoices`).doc();
                    
                    batch.set(newInvoiceRef, invoiceData);
                    batch.update(appointmentRef, { status: 'completed' });
                    
                    await batch.commit();

                    invoicesCreated++;
                } else {
                    await appointmentRef.update({ status: 'completed' });
                }
                completedCount++;
            }
        }
        
        return NextResponse.json({ message: `${completedCount} appointments marked completed. ${invoicesCreated} invoice drafts created.` });

    } catch (error) {
        console.error("Cron job (appointments) failed:", error);
        return NextResponse.json({ error: 'Failed to process appointments.' }, { status: 500 });
    }
}