// src/emails/OverdueReminderEmail.tsx
import * as React from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

interface OverdueReminderEmailProps {
    invoice: Invoice;
    client: Client;
    user: UserProfile;
}

export default function OverdueReminderEmail({ invoice, client, user }: OverdueReminderEmailProps) {
    return (
        <html>
            <body>
                <h1>Payment Reminder</h1>
                <p>Hi {client.name},</p>
                <p>This is a reminder that invoice #{invoice.invoiceNumber} is overdue.</p>
                <p>
                    Thank you,
                    <br />
                    {user.name || 'Your Name'}
                </p>
            </body>
        </html>
    );
}