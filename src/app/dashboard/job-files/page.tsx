import JobFilesPageWrapper from '@/components/JobFilesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function JobFilesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <JobFilesPageWrapper userId={userId} />;
}