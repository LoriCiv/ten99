import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardPageContent from "@/components/DashboardPageContent";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// A simple loading skeleton to show while the main content loads
const DashboardLoading = () => (
    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
);

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) {
        // This should be handled by middleware, but it's a good safeguard
        redirect('/sign-in');
    }

    // This Server Component is now very simple.
    // It just renders the Client Component and passes the userId.
    // The Client Component will handle all of its own data fetching and loading states.
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardPageContent userId={userId} />
        </Suspense>
    );
}