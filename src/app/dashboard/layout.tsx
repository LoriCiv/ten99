"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, UserButton } from "@clerk/nextjs"; // ✅ Import Clerk components
import { ThumbsUp, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign, Menu, X, Briefcase } from 'lucide-react';
import { getMessagesForUser } from '@/utils/firestoreService';
import type { Message } from '@/types/app-interfaces';
import Image from 'next/image';

// NOTE: We will get the real userId from Clerk in each page file now.

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
    const [messages, setMessages] = useState<Message[]>([]);
    const unreadCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);
    
    const pathname = usePathname();
    
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // This useEffect can be removed if you get the userId from Clerk in the page itself
    // For now, we'll leave it but it will need to be updated to get the real userId
    // useEffect(() => {
    //   const unsubscribe = getMessagesForUser(TEMP_USER_ID, (fetchedMessages) => {
    //       setMessages(fetchedMessages);
    //   });
    //   return () => unsubscribe();
    // }, []);

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
        <SignedIn> {/* ✅ Protect all child routes */}
            <div className="flex min-h-screen bg-background">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 flex-shrink-0 border-r bg-card p-4 flex-col">
                    <div className="flex items-center justify-between mb-8 pl-3">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Image src="/logo.png" alt="Ten99 Logo" width={28} height={28} />
                            <h1 className="text-2xl font-bold">Ten99</h1>
                        </Link>
                        <UserButton afterSignOutUrl="/" /> {/* ✅ Add User Button */}
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

                        {/* ✅ Add User Button to mobile header */}
                        <UserButton afterSignOutUrl="/" />
                    </header>
                    
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </SignedIn>
    )
}