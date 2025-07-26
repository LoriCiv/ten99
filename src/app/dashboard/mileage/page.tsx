import MileagePageContent from '@/components/MileagePageContent';
import { auth } from "@clerk/nextjs/server";
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

export default async function MileagePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Mileage Tracker...</div>}>
        <MileagePageContent userId={userId} />
    </Suspense>
  );
}