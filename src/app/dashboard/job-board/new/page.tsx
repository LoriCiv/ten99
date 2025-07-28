// src/app/dashboard/job-board/new/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewJobPostPageContent from "@/components/NewJobPostPageContent"; // This is the new component we'll create

// This is the server component shell.
export default async function NewJobPostPage() {
  
  // Safely get the userId on the server.
  const { userId } = await auth();

  // If no user, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Render the client component that will handle all logic and display.
  return <NewJobPostPageContent userId={userId} />;
}