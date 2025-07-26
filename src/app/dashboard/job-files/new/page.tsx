import NewJobFilePageContent from '@/components/NewJobFilePageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function NewJobFilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <NewJobFilePageContent userId={userId} />;
}