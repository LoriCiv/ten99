import CertificationsPageContent from '@/components/CertificationsPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function CertificationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // We will now pass the real userId to the component that handles the display and data fetching.
  return <CertificationsPageContent userId={userId} />;
}