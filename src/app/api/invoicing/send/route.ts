// src/app/api/invoicing/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const createInvoiceHtml = (invoice: Invoice, client: Client, user: UserProfile): string => {
    // This is a simplified HTML generator. You can make this as complex as you like.
    const total = invoice.total || 0;
    return `<h1>Invoice #${invoice.invoiceNumber}</h1><p>Hi ${client.name},</p><p>This is an invoice for the amount of <strong>$${total.toFixed(2)}</strong>.</p><p>Thank you,<br/>${user.name || 'Your Business'}</p>`;
};

export async function POST(request: NextRequest) {
    if (!process.env.SENDGRID_API_KEY) {
        return NextResponse.json({ error: 'Server not configured for sending email.' }, { status: 500 });
    }

    try {
        const { invoiceId, userId } = await request.json();
        if (!invoiceId || !userId) {
            return NextResponse.json({ error: 'Missing invoiceId or userId' }, { status: 400 });
        }

        const invoiceRef = db.doc(`users/${userId}/invoices/${invoiceId}`);
        const invoiceSnap = await invoiceRef.get();
        if (!invoiceSnap.exists) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;

        const clientRef = db.doc(`users/${userId}/clients/${invoice.clientId}`);
        const userProfileRef = db.doc(`users/${userId}/profile/mainProfile`);

        const [clientSnap, userProfileSnap] = await Promise.all([clientRef.get(), userProfileRef.get()]);

        if (!clientSnap.exists || !userProfileSnap.exists) {
            return NextResponse.json({ error: 'Client or User Profile not found' }, { status: 404 });
        }
        const client = clientSnap.data() as Client;
        const user = userProfileSnap.data() as UserProfile;

        const recipientEmail = client.billingEmail || client.email;
        if (!recipientEmail) {
            return NextResponse.json({ error: 'Client email not found' }, { status: 400 });
        }

        const emailHtml = createInvoiceHtml(invoice, client, user);
        
        const msg = {
            to: recipientEmail,
            from: { email: 'invoices@ten99.app', name: user.name || 'Ten99 App' },
            subject: `Invoice #${invoice.invoiceNumber} from ${user.name || ''}`,
            html: emailHtml,
        };

        await sgMail.send(msg);

        // Update the invoice status to 'sent' if it was a draft
        if (invoice.status === 'draft') {
            await invoiceRef.update({ status: 'sent', invoiceDate: new Date().toISOString().split('T')[0] });
        } else if (invoice.status === 'overdue') {
            // If it was overdue, we can just mark it as sent again
             await invoiceRef.update({ status: 'sent' });
        }
        
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error sending invoice:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}