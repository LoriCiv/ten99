// src/app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';

import InvoiceEmail from '@/emails/InvoiceEmail';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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

        const subject = `Invoice #${invoice.invoiceNumber} from ${user.name || user.professionalTitle || 'Your Business'}`;
        
        // ✅ FIXED: Added 'await' to get the final HTML string
        const emailHtml = await render(<InvoiceEmail invoice={invoice} client={client} user={user} />);

        const msg = {
            to: recipientEmail,
            from: {
                email: 'invoices@ten99.app',
                name: user.name || user.professionalTitle || 'Your Business'
            },
            subject: subject,
            html: emailHtml, // This is now a string, not a Promise
        };

        await sgMail.send(msg);

        return NextResponse.json({ message: 'Email sent successfully!' });

    } catch (err) {
        const error = err as Error;
        console.error("API error sending invoice:", error);
        return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }
}