// src/app/dashboard/invoices/new/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewInvoicePageContent from "@/components/NewInvoicePageContent"; // ✅ Corrected component import
import { Suspense } from 'react';

// This is the server component shell.
export default async function NewInvoicePage() {
  
  // Safely get the userId on the server.
  const { userId } = await auth();

  // If no user, redirect away.
  if (!userId) {
    redirect("/");
  }

  // Render the client component that will handle all logic and display.
  // The Suspense wrapper is necessary because the component uses searchParams.
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Form...</div>}>
        <NewInvoicePageContent userId={userId} />
    </Suspense>
  );
}