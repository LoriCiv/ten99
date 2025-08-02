import JobFilesPageContent from '@/components/JobFilesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function JobFilesPage({ searchParams }: { searchParams?: { [key: string]: string | undefined } }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const clientFilter = typeof searchParams?.client === 'string' ? searchParams.client : '';

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job Files...</div>}>
      <JobFilesPageContent userId={userId} initialClientFilter={clientFilter} />
    </Suspense>
  );
}