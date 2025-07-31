import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
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
          This is your command center. You can navigate using the menu on the left.
        </p>
      </div>
    </div>
  );
}