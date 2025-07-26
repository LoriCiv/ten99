import { Suspense } from 'react';
import NewAppointmentPageContent from '@/components/NewAppointmentPageContent';

// This is our temporary user ID for development
const TEMP_USER_ID = "dev-user-1";

export default function NewAppointmentPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <NewAppointmentPageContent userId={TEMP_USER_ID} />
        </Suspense>
    );
}