// src/app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { InvoiceEmail } from '@/components/emails/InvoiceEmail';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { invoice, client, user } = await request.json() as { invoice: Invoice, client: Client, user: UserProfile };

        if (!invoice || !client || !user) {
            return NextResponse.json({ error: 'Missing invoice, client, or user data' }, { status: 400 });
        }

        const recipientEmail = client.billingEmail || client.email;
        if (!recipientEmail) {
            return NextResponse.json({ error: 'Recipient email is missing' }, { status: 400 });
        }

        const subject = `Invoice #${invoice.invoiceNumber} from ${user.professionalTitle || 'Your Business'}`;

        const { data, error } = await resend.emails.send({
            from: 'invoices@ten99.app', // Make sure this is a verified Resend domain
            to: [recipientEmail],
            subject: subject,
            react: <InvoiceEmail invoice={invoice} client={client} user={user} />,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully!', data });

    } catch (err) {
        const error = err as Error;
        console.error("API error:", error);
        return NextResponse.json({ error: error.message || 'An internal error occurred' }, { status: 500 });
    }
}