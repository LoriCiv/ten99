import NewAppointmentPageWrapper from '@/components/NewAppointmentPageContent';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

export default async function NewAppointmentPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <NewAppointmentPageWrapper userId={userId} />;
}