import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  // ✅ REPAIR: Add the 'await' keyword here
  const { userId } = await auth();

  if (!userId) {
    // This should not happen if middleware is correct, but it's a good safeguard
    return <div>Not logged in</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold">Welcome to your Ten99 Dashboard!</h2>
        <p className="text-muted-foreground mt-2">
          This is your command center. From here, you can manage your clients, appointments, invoices, and more.
        </p>
      </div>
    </div>
  );
}