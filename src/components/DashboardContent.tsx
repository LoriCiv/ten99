"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Briefcase, Mail, Calendar, LayoutDashboard } from "lucide-react";

// Configuration for the sidebar navigation items
const sidebarNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients & Connections", icon: Briefcase },
  { href: "/dashboard/job-files", label: "Job Files", icon: FileText },
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  // We can add more links here later, like "Inbox" or "Invoicing"
];

/**
 * This is the main layout for the entire dashboard.
 * It includes the sidebar navigation and the main content area
 * where all the other pages will be rendered.
 */
export default function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-center h-16 px-6 border-b border-border">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            Ten99
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground" // Active link style
                  : "hover:bg-accent hover:text-accent-foreground" // Hover style
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
