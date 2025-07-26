import DashboardPageContent from '@/components/DashboardPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // ✅ FIX: Add the "await" keyword here
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <DashboardPageContent userId={userId} />;
}