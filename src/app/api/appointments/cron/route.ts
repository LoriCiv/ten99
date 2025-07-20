// src/app/api/appointments/cron/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Appointment } from '@/types/app-interfaces';

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
            .where('eventType', '==', 'job') 
            .get();

        if (snapshot.empty) {
            console.log('No scheduled jobs found to update.');
            return NextResponse.json({ message: 'No scheduled jobs to update.' });
        }

        const batch = db.batch();
        let updatedCount = 0;

        for (const doc of snapshot.docs) {
            const appt = { id: doc.id, ...doc.data() } as Appointment;

            if (!appt.date || !appt.time) {
                continue; 
            }

            let endTimeString = appt.endTime;
            if (!endTimeString) {
                const [hours, minutes] = appt.time.split(':');
                const nextHour = (parseInt(hours, 10) + 1) % 24;
                endTimeString = `${String(nextHour).padStart(2, '0')}:${minutes}`;
            }
            
            const endDateTime = new Date(`${appt.date}T${endTimeString}`);

            if (endDateTime < now) {
                console.log(`Updating job ${appt.id} to "completed".`);
                // ✅ THE FIX: Use the correct syntax for the Admin SDK
                const docRef = db.doc(`users/${TEMP_USER_ID}/appointments/${appt.id}`);
                batch.update(docRef, { status: 'completed' });
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            await batch.commit();
        }

        const message = `Cron job finished. Updated ${updatedCount} jobs to "completed".`;
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