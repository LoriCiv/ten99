import { auth } from '@clerk/nextjs/server';
import DashboardPageContent from '@/components/DashboardPageContent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
      // If there's no user, send them to the sign-in page
      redirect('/sign-in');
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>}>
            {/* This passes the real, unique userId to the component that shows the dashboard */}
            <DashboardPageContent userId={userId} />
        </Suspense>
    );
}