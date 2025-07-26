import NewInvoicePageWrapper from '@/components/NewInvoicePageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function NewInvoicePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <NewInvoicePageWrapper userId={userId} />;
}