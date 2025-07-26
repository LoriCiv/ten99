import InvoicesPageContent from '@/components/InvoicesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function InvoicesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Invoices...</div>}>
        <InvoicesPageContent userId={userId} />
    </Suspense>
  );
}