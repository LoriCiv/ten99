// src/app/api/invoicing/cron/route.ts
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin'; // Use default import
import type { Invoice } from '@/types/app-interfaces';

const db = admin.firestore(); // Get firestore from the admin object

export async function GET(request: Request) {
    const today = new Date().toISOString().split('T')[0];
    const invoicesRef = db.collectionGroup('invoices');
    const q = invoicesRef.where('status', '==', 'sent').where('dueDate', '<', today);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No overdue invoices found.' });
        }

        const batch = db.batch();
        snapshot.forEach(doc => { // No 'any' type error here
            const invoiceRef = doc.ref;
            batch.update(invoiceRef, { status: 'overdue' });
        });

        await batch.commit();
        return NextResponse.json({ message: `${snapshot.size} invoices marked as overdue.` });

    } catch (error) {
        console.error("Cron job (invoicing) failed:", error);
        return NextResponse.json({ error: 'Failed to process invoices.' }, { status: 500 });
    }
}