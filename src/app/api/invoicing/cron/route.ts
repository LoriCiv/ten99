// src/app/api/invoicing/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET() { // Remove unused 'request' parameter
    const today = new Date().toISOString().split('T')[0];
    const invoicesRef = db.collectionGroup('invoices');
    const q = invoicesRef.where('status', '==', 'sent').where('dueDate', '<', today);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No overdue invoices found.' });
        }

        const batch = db.batch();
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
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