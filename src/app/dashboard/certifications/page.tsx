// src/app/dashboard/certifications/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CertificationsPageContent from "@/components/CertificationsPageContent";

// This is the simple, safe server component shell
export default async function CertificationsPage() {
  
  // It safely gets the userId on the server
  const { userId } = await auth();

  // It redirects if the user isn't logged in
  if (!userId) {
    redirect("/");
  }

  // It renders the client component that will now do all the real work
  return <CertificationsPageContent userId={userId} />;
}