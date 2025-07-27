// src/app/dashboard/settings/page.tsx

import { auth } from '@clerk/nextjs/server';
import SettingsPageContent from '@/components/SettingsPageContent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Settings...</div>}>
            <SettingsPageContent userId={userId} />
        </Suspense>
    );
}