// src/app/dashboard/layout.tsx
import Link from 'next/link';
import { Briefcase, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Briefcase },
    { name: 'Clients & Connections', href: '/dashboard/clients', icon: Users },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Job Files', href: '/dashboard/job-files', icon: FileText },
    { name: 'Mailbox', href: '/dashboard/mailbox', icon: Mail },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'My Money', href: '/dashboard/my-money', icon: DollarSign }, // ✅ NEW LINK
    { name: 'Credentials', href: '/dashboard/certifications', icon: Award },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 flex-shrink-0 border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <Briefcase className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Ten99</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}