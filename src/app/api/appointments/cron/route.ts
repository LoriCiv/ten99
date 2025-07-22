// src/app/api/appointments/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET() { // Remove unused 'request' parameter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsRef = db.collectionGroup('appointments');
    const q = appointmentsRef.where('status', 'in', ['scheduled', 'pending']);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No appointments to update.' });
        }

        const batch = db.batch();
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
            const appointment = doc.data();
            const apptDate = new Date(appointment.date + 'T23:59:59');

            if (apptDate < today) {
                const apptRef = doc.ref;
                batch.update(apptRef, { status: 'completed' });
            }
        });

        await batch.commit();
        return NextResponse.json({ message: 'Past appointments updated to "completed".' });

    } catch (error) {
        console.error("Cron job (appointments) failed:", error);
        return NextResponse.json({ error: 'Failed to process appointments.' }, { status: 500 });
    }
}