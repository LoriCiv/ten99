// src/components/DashboardUI.tsx

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from "@clerk/nextjs";
import { ThumbsUp, Users, Calendar, FileText, Mail, Settings, Receipt, Award, DollarSign, Menu, X, Briefcase } from 'lucide-react';
import Image from 'next/image';

const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
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
        </Link>
    );
};

export default function DashboardUI({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    
    useEffect(() => {
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
                <NavLink key={item.name} href={item.href} icon={item.icon}>
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="flex min-h-screen bg-background">
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
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2">
                        <Menu className="h-6 w-6"/>
                        <span className="sr-only">Open Menu</span>
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Ten99 Logo" width={28} height={28} />
                        <h1 className="text-xl font-bold">Ten99</h1>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                </header>
                
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}