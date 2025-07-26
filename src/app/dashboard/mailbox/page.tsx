import MailboxPageWrapper from '@/components/MailboxPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function MailboxPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <MailboxPageWrapper userId={userId} />;
}