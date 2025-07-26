import ClientsPageContent from '@/components/ClientsPageContent'; // <-- Corrected import path
import { Suspense } from 'react';

const TEMP_USER_ID = "dev-user-1";

export default function ClientsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <ClientsPageContent userId={TEMP_USER_ID} />
        </Suspense>
    );
}