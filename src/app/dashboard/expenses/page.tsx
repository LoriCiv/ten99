import ExpensesPageContent from '@/components/ExpensesPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function ExpensesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // This now only passes the userId prop, which is what the content component expects.
  return <ExpensesPageContent userId={userId} />;
}