import { auth } from '@clerk/nextjs/server';
import ClientsPageContent from '@/components/ClientsPageContent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// ✅ Add "async" to the function signature
export default async function ClientsPage() {
    // ✅ Add "await" before the auth() call
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <ClientsPageContent userId={userId} />
        </Suspense>
    );
}