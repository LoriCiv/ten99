import JobFilesPageContent from '@/components/JobFilesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function JobFilesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Job Files...</div>}>
        <JobFilesPageContent userId={userId} />
    </Suspense>
  );
}