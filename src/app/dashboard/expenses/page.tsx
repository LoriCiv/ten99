import ExpensesPageContent from '@/components/ExpensesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function ExpensesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Expenses...</div>}>
        <ExpensesPageContent userId={userId} />
    </Suspense>
  );
}