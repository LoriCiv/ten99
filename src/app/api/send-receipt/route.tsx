// src/app/api/send-receipt/route.tsx
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
// ✅ THE FIX: Changed to a default import (no curly braces)
import ReceiptEmail from '@/emails/ReceiptEmail';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { invoice, client, user } = await request.json() as { invoice: Invoice, client: Client, user: UserProfile };

        if (!invoice || !client || !user) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const recipientEmail = client.billingEmail || client.email;
        if (!recipientEmail) {
            return NextResponse.json({ error: 'Recipient email is missing' }, { status: 400 });
        }

        const subject = `Receipt for Invoice #${invoice.invoiceNumber}`;

        const { data, error } = await resend.emails.send({
            from: 'receipts@ten99.app', // Make sure this is a verified Resend domain
            to: [recipientEmail],
            subject: subject,
            react: <ReceiptEmail invoice={invoice} client={client} user={user} />,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Receipt sent successfully!', data });

    } catch (err) {
        const error = err as Error;
        console.error("API error:", error);
        return NextResponse.json({ error: error.message || 'An internal error occurred' }, { status: 500 });
    }
}