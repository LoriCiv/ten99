import { Suspense } from 'react';
import InvoicesPageContent from '@/components/InvoicesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function InvoicesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // We keep the Suspense wrapper here as it's good practice for handling search params
  return (
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
          <InvoicesPageContent userId={userId} />
      </Suspense>
  );
}