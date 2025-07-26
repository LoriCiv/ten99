import ClientsPageContent from '@/components/ClientsPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <ClientsPageContent userId={userId} />;
}