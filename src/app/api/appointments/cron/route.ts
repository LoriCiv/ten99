// src/app/api/appointments/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Appointment } from '@/types/app-interfaces';

export async function GET() {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all appointments across all users that are still 'scheduled' but their date is in the past
    const appointmentsRef = db.collectionGroup('appointments');
    const q = appointmentsRef.where('status', '==', 'scheduled').where('date', '<', today);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            console.log("Appointment Cron: No appointments to update.");
            return NextResponse.json({ message: 'No appointments to update.' });
        }

        const batch = db.batch();
        let updatedCount = 0;

        snapshot.docs.forEach(doc => {
            const appointmentRef = doc.ref;
            batch.update(appointmentRef, { status: 'completed' });
            updatedCount++;
        });

        await batch.commit();
        const summary = `${updatedCount} appointments marked as 'completed'.`;
        console.log(`Appointment Cron finished: ${summary}`);
        return NextResponse.json({ message: summary });

    } catch (error) {
        console.error("Appointment Cron job failed:", error);
        return NextResponse.json({ error: 'Failed to process appointments.' }, { status: 500 });
    }
}