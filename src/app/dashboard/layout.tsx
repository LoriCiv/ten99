// src/app/dashboard/layout.tsx
"use client"; // ✅ This must be a client component to handle menu state

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign, Menu, X } from 'lucide-react';

// ✅ NavLink Component to handle active states
const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-primary'
            }`}
        >
            <Icon className="h-5 w-5" />
            {children}
        </Link>
    );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ State to manage the mobile menu's open/closed status
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Briefcase },
    { name: 'Clients & Connections', href: '/dashboard/clients', icon: Users },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Job Files', href: '/dashboard/job-files', icon: FileText },
    { name: 'Mailbox', href: '/dashboard/mailbox', icon: Mail },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'My Money', href: '/dashboard/my-money', icon: DollarSign },
    { name: 'Credentials', href: '/dashboard/certifications', icon: Award },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];
  
  // ✅ Reusable navigation markup
  const navigationMenu = (
      <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
              <NavLink key={item.name} href={item.href} icon={item.icon}>
                  {item.name}
              </NavLink>
          ))}
      </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
        {/* ✅ DESKTOP SIDEBAR: Hidden on mobile, visible on large screens */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-border p-6 flex-col">
            <div className="flex items-center gap-2 mb-10">
                <Briefcase className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Ten99</h1>
            </div>
            {navigationMenu}
        </aside>

        {/* ✅ MOBILE MENU OVERLAY: Shows when the hamburger icon is clicked */}
        {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}>
                <div 
                    className="fixed inset-y-0 left-0 z-50 w-64 bg-card p-6 flex flex-col" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-8 w-8 text-primary" />
                            <h1 className="text-2xl font-bold">Ten99</h1>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-1">
                           <X className="h-6 w-6"/>
                        </button>
                    </div>
                    {navigationMenu}
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1">
            {/* ✅ MOBILE HEADER: Visible only on mobile, hidden on large screens */}
            <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-1"
                >
                    <Menu className="h-6 w-6"/>
                    <span className="sr-only">Open Menu</span>
                </button>
                <div className="flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Ten99</h1>
                </div>
            </header>
            
            <main className="flex-1">
                {children}
            </main>
        </div>
    </div>
  )
}