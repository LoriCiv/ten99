// src/app/dashboard/my-money/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Invoice } from '@/types/app-interfaces';
import { getInvoices } from '@/utils/firestoreService';

const TEMP_USER_ID = "dev-user-1";

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

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Financials...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">My Money</h1>
                <p className="text-muted-foreground">A high-level overview of your freelance business.</p>
            </header>

            {/* We will add the financial summary cards here in the next step */}
            <div>
                {/* Placeholder for content */}
            </div>
        </div>
    );
}