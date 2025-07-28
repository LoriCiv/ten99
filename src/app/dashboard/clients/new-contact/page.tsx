// src/app/dashboard/clients/new-contact/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewContactPageContent from "@/components/NewContactPageContent"; // This is the new component we'll create

// This is the server component shell.
export default async function NewContactPage() {
  
  // Safely get the userId on the server.
  const { userId } = await auth();

  // If no user, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Render the client component that will handle all logic and display.
  return <NewContactPageContent userId={userId} />;
}