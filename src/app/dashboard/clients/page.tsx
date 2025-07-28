// src/app/dashboard/clients/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientsPageContent from "@/components/ClientsPageContent";

// This is the server component shell.
export default async function ClientsPage() {
  
  // Safely get the userId on the server.
  const { userId } = await auth();

  // If no user, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Render the client component that will handle all logic and display.
  return <ClientsPageContent userId={userId} />;
}