import AppointmentsPageContent from '@/components/AppointmentsPageContent'; // <-- This is the corrected import path
import { Suspense } from 'react';

const TEMP_USER_ID = "dev-user-1";

export default function AppointmentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Calendar...</div>}>
            <AppointmentsPageContent userId={TEMP_USER_ID} />
        </Suspense>
    );
}