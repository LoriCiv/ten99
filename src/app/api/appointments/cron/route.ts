// src/app/api/appointments/cron/route.ts
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin'; // Use default import

const db = admin.firestore(); // Get firestore from the admin object
const TEMP_USER_ID = "dev-user-1";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    console.log('Running hourly appointment status update cron job...');

    try {
        const now = new Date();
        const appointmentsRef = db.collection(`users/${TEMP_USER_ID}/appointments`);
        
        const snapshot = await appointmentsRef
            .where('status', '==', 'scheduled')
            .get();

        if (snapshot.empty) {
            console.log('No scheduled jobs found to update.');
            return NextResponse.json({ message: 'No scheduled jobs to update.' });
        }

        const batch = db.batch();
        let updatesCount = 0;

        snapshot.forEach(doc => {
            const appointment = doc.data();
            const apptDateTime = new Date(`${appointment.date}T${appointment.time}`);
            
            if (apptDateTime < now) {
                const apptRef = doc.ref;
                batch.update(apptRef, { status: 'completed' });
                updatesCount++;
            }
        });

        if (updatesCount > 0) {
            await batch.commit();
        }

        const message = `Cron job finished. Updated ${updatesCount} appointments to "completed".`;
        console.log(message);
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Cron job (appointments) failed:", error);
        return NextResponse.json({ error: 'Failed to process appointments.' }, { status: 500 });
    }
}