// src/app/dashboard/settings/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/SettingsPageContent"; // This is the component we'll fix next

// This is a Server Component
export default async function SettingsPage() {
  
  // Safely get the userId using async/await
  const { userId } = await auth();

  // Redirect if the user is not logged in
  if (!userId) {
    redirect("/");
  }

  // Render the client component and pass the userId to it
  return <SettingsPageContent userId={userId} />;
}