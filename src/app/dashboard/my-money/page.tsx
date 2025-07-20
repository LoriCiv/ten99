// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Invoice } from '@/types/app-interfaces';
import { getInvoices } from '@/utils/firestoreService';
import { DollarSign, Hourglass, CheckCircle } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

// A reusable component for our summary cards
function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
    return (
        <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function MyMoneyPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getInvoices(TEMP_USER_ID, (data) => {
            setInvoices(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ✅ Use useMemo to calculate the financial stats
    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        
        const ytdIncome = invoices
            .filter(inv => inv.status === 'paid' && new Date(inv.invoiceDate).getFullYear() === currentYear)
            .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const outstanding = invoices
            .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);
            
        const totalCollected = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.total || 0), 0);

        return {
            ytdIncome: ytdIncome.toFixed(2),
            outstanding: outstanding.toFixed(2),
            totalCollected: totalCollected.toFixed(2)
        };
    }, [invoices]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Financials...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">My Money</h1>
                <p className="text-muted-foreground">A high-level overview of your freelance business.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="YTD Income" value={`$${stats.ytdIncome}`} icon={DollarSign} />
                <StatCard title="Outstanding Invoices" value={`$${stats.outstanding}`} icon={Hourglass} />
                <StatCard title="All-Time Collected" value={`$${stats.totalCollected}`} icon={CheckCircle} />
            </div>

            {/* We can add charts or recent transaction lists here later */}
        </div>
    );
}