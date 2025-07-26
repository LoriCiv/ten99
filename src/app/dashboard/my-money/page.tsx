import MyMoneyPageContent from '@/components/MyMoneyPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function MyMoneyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <MyMoneyPageContent userId={userId} />;
}