import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // ✅ Correct import
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const createInvoiceHtml = (invoice: Invoice, client: Client, user: UserProfile): string => {
    const total = invoice.total || 0;
    // This is a simplified HTML generator. You can make this as complex as you like.
    return `<h1>Invoice #${invoice.invoiceNumber}</h1><p>Hi ${client.name},</p><p>This is an invoice for the amount of <strong>$${total.toFixed(2)}</strong>.</p><p>Thank you,<br/>${user.name || 'Your Business'}</p>`;
};

export async function POST(request: NextRequest) {
    if (!process.env.SENDGRID_API_KEY) {
        return NextResponse.json({ error: 'Server not configured for sending email.' }, { status: 500 });
    }

    try {
        const db = adminDb; // ✅ Use the imported adminDb directly

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
        const userProfileRef = db.doc(`users/${userId}`);

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

        // Update invoice status after sending
        if (invoice.status === 'draft' || invoice.status === 'overdue') {
            await invoiceRef.update({ status: 'sent' });
        }
        
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error sending invoice:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}