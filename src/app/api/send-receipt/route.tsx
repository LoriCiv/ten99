// src/app/api/send-receipt/route.ts
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';

import ReceiptEmail from '@/emails/ReceiptEmail';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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
        const emailHtml = await render(<ReceiptEmail invoice={invoice} client={client} user={user} />);

        const msg = {
            to: recipientEmail,
            from: {
                email: 'receipts@ten99.app',
                name: user.name || user.professionalTitle || 'Your Business',
            },
            subject: subject,
            html: emailHtml,
        };

        await sgMail.send(msg);

        return NextResponse.json({ message: 'Receipt sent successfully!' });

    } catch (err) {
        const error = err as Error;
        console.error("API error sending receipt:", error);
        return NextResponse.json({ error: 'Failed to send receipt.' }, { status: 500 });
    }
}