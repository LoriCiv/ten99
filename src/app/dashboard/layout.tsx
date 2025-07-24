"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThumbsUp, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign, Menu, X, Briefcase } from 'lucide-react';

const NavLink = ({ href, icon: Icon, children, closeMenu }: { href: string, icon: React.ElementType, children: React.ReactNode, closeMenu: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    return (
        <Link
            href={href}
            onClick={closeMenu}
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'My Profile', href: '/profile/dev-user-1', icon: Users },
        { name: 'Job Board', href: '/dashboard/job-board', icon: Briefcase },
        { name: 'Clients & Connections', href: '/dashboard/clients', icon: Users },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { name: 'Job Files', href: '/dashboard/job-files', icon: FileText },
        { name: 'Mailbox', href: '/dashboard/mailbox', icon: Mail },
        { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
        { name: 'My Money', href: '/dashboard/my-money', icon: DollarSign },
        { name: 'Credentials', href: '/dashboard/certifications', icon: Award },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
 
    const navigationMenu = (
      <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
              <NavLink key={item.name} href={item.href} icon={item.icon} closeMenu={() => setIsMobileMenuOpen(false)}>
                  {item.name}
              </NavLink>
          ))}
      </nav>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-border p-6 flex-col">
                <Link href="/dashboard" className="flex items-center gap-2 mb-10">
                    <ThumbsUp className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold">Ten99</h1>
                </Link>
                {navigationMenu}
            </aside>

            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-card p-6 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-end mb-10 h-8">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1">
                               <X className="h-6 w-6"/>
                            </button>
                        </div>
                        {navigationMenu}
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1">
                <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-1"
                    >
                        <Menu className="h-6 w-6"/>
                        <span className="sr-only">Open Menu</span>
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <ThumbsUp className="h-6 w-6 text-primary" />
                        <span className="font-bold">Ten99</span>
                    </Link>
                </header>
                
                {/* ✅ THIS IS THE FIX */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}