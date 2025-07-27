// src/app/dashboard/layout.tsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ThumbsUp, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign, Menu, X, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { FirebaseProvider } from '@/components/FirebaseProvider'; // ✅ 1. Import the FirebaseProvider

// NOTE: The unread message count logic will be moved to the Mailbox page
// where it can safely use the useFirebase hook. For now, we'll pass a placeholder.

const NavLink = ({ href, icon: Icon, children, count }: { href: string, icon: React.ElementType, children: React.ReactNode, count?: number }) => {
    const pathname = usePathname();
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-base font-medium ${
                isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary'
            }`}
        >
            <Icon className="h-5 w-5" />
            <span>{children}</span>
            {count !== undefined && count > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                    {count}
                </span>
            )}
        </Link>
    );
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // This logic for fetching messages is removed from the layout.
    // Each page (like Mailbox) will now be responsible for its own data fetching
    // after confirming Firebase is authenticated via the useFirebase() hook.
    const unreadCount = 0; // Placeholder
    
    const pathname = usePathname();
    
    useEffect(() => {
        // Close mobile menu on navigation
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: ThumbsUp },
        { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { name: 'Mailbox', href: '/dashboard/mailbox', icon: Mail },
        { name: 'Job Board', href: '/dashboard/job-board', icon: Briefcase },
        { name: 'Job Files', href: '/dashboard/job-files', icon: FileText },
        { name: 'Clients', href: '/dashboard/clients', icon: Users },
        { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
        { name: 'My Money', href: '/dashboard/my-money', icon: DollarSign },
        { name: 'Credentials', href: '/dashboard/certifications', icon: Award },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
    
    const navigationMenu = (
        <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    href={item.href}
                    icon={item.icon}
                    count={item.name === 'Mailbox' ? unreadCount : undefined}
                >
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <SignedIn>
            {/* ✅ 2. Wrap the entire dashboard structure with the FirebaseProvider */}
            <FirebaseProvider>
                <div className="flex min-h-screen bg-background">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:flex w-64 flex-shrink-0 border-r bg-card p-4 flex-col">
                        <div className="flex items-center justify-between mb-8 pl-3">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Image src="/logo.png" alt="Ten99 Logo" width={28} height={28} />
                                <h1 className="text-2xl font-bold">Ten99</h1>
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </div>
                        {navigationMenu}
                    </aside>

                    {/* Mobile Flyout Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}>
                            <div
                                className="fixed inset-y-0 left-0 z-50 w-64 bg-card p-4 flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-8 pl-3">
                                    <Link href="/dashboard" className="flex items-center gap-2">
                                        <Image src="/logo.png" alt="Ten99 Logo" width={28} height={28} />
                                        <h1 className="text-2xl font-bold">Ten99</h1>
                                    </Link>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1">
                                        <X className="h-6 w-6"/>
                                    </button>
                                </div>
                                {navigationMenu}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col flex-1">
                        <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2"
                            >
                                <Menu className="h-6 w-6"/>
                                <span className="sr-only">Open Menu</span>
                            </button>
                            
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Image src="/logo.png" alt="Ten99 Logo" width={28} height={28} />
                                <h1 className="text-xl font-bold">Ten99</h1>
                            </Link>

                            <UserButton afterSignOutUrl="/" />
                        </header>
                        
                        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                            {/* All your page content will be rendered here, now with Firebase access */}
                            {children}
                        </main>
                    </div>
                </div>
            </FirebaseProvider>
        </SignedIn>
    )
}