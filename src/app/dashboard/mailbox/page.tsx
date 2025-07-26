import MailboxPageContent from '@/components/MailboxPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function MailboxPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Mailbox...</div>}>
        <MailboxPageContent userId={userId} />
    </Suspense>
  );
}