// src/app/dashboard/appointments/new/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewAppointmentPageContent from "@/components/NewAppointmentPageContent";

// ✅ 1. Mark the component as an async function.
export default async function NewAppointmentPage() {
  
  // ✅ 2. Use 'await' to get the value from the auth() promise.
  const { userId } = await auth();

  // If for any reason the userId is not available, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Now we have a guaranteed userId, and can safely render the client component.
  return <NewAppointmentPageContent userId={userId} />;
}