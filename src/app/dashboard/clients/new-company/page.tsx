// src/app/dashboard/clients/new-company/page.tsx

import { auth } from "@clerk/nextjs/server"; // ✅ Import 'auth'
import { redirect } from "next/navigation";
import NewCompanyPageContent from "@/components/NewCompanyPageContent";

// This is the server component shell.
export default async function NewCompanyPage() {
  
  // Safely get the userId on the server.
  const { userId } = await auth();

  // If no user, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Render the client component that will handle all logic and display.
  return <NewCompanyPageContent userId={userId} />;
}