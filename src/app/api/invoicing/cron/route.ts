import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';
import sgMail from '@sendgrid/mail';

// REMOVED: render and OverdueReminderEmail imports

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn("SENDGRID_API_KEY environment variable not set. Emails will not be sent.");
}

// ✅ NEW: A function to create the email HTML directly
const createOverdueReminderHtml = (invoice: Invoice, client: Client, user: UserProfile): string => {
    const total = invoice.total || 0;
    return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px;">
            <div style="background-color: #ffffff; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 5px; max-width: 600px;">
                <h1 style="color: #333; font-size: 24px;">Payment Reminder</h1>
                <p style="font-size: 16px; line-height: 24px;">Hi ${client.name},</p>
                <p style="font-size: 16px; line-height: 24px;">
                    This is a friendly reminder that invoice #${invoice.invoiceNumber} for the amount of <strong>$${total.toFixed(2)}</strong> was due on ${invoice.dueDate} and is now overdue.
                </p>
                <p style="font-size: 16px; line-height: 24px;">
                    You can view the invoice details and make a payment using the information provided in the original invoice.
                </p>
                <p style="font-size: 16px; line-height: 24px;">
                    Thank you,<br />
                    ${user.name || user.professionalTitle || 'Your Business'}
                </p>
            </div>
        </body>
        </html>
    `;
};

export async function GET() {
    if (!process.env.SENDGRID_API_KEY) {
        return NextResponse.json({ error: 'SendGrid API Key not configured.' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];
    const invoicesRef = db.collectionGroup('invoices');
    const q = invoicesRef.where('status', '==', 'sent').where('dueDate', '<', today);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No overdue invoices found.' });
        }

        const batch = db.batch();
        let overdueCount = 0;
        let emailsSent = 0;

        await Promise.all(snapshot.docs.map(async (doc) => {
            const invoice = { id: doc.id, ...doc.data() } as Invoice;
            const invoiceRef = doc.ref;

            batch.update(invoiceRef, { status: 'overdue' });
            overdueCount++;

            const userRef = invoiceRef.parent.parent;
            if (!userRef) return;

            const userProfileRef = userRef.collection('profile').doc('mainProfile');
            const clientRef = userRef.collection('clients').doc(invoice.clientId);

            const [userProfileSnap, clientSnap] = await Promise.all([
                userProfileRef.get(),
                clientRef.get()
            ]);

            if (userProfileSnap.exists && clientSnap.exists) {
                const user = userProfileSnap.data() as UserProfile;
                const client = { id: clientSnap.id, ...clientSnap.data() } as Client;
                const recipientEmail = client.billingEmail || client.email;

                if (user.sendOverdueReminders && recipientEmail) {
                    const subject = `Reminder: Invoice #${invoice.invoiceNumber} is Overdue`;
                    
                    // ✅ FIX: Call our new function to get the HTML string
                    const emailHtml = createOverdueReminderHtml(invoice, client, user);

                    const msg = {
                        to: recipientEmail,
                        from: {
                            email: 'invoices@ten99.app',
                            name: user.name || 'Ten99 Invoicing'
                        },
                        subject,
                        html: emailHtml,
                    };

                    await sgMail.send(msg);
                    emailsSent++;
                }
            }
        }));

        await batch.commit();
        const summary = `${overdueCount} invoices marked overdue. ${emailsSent} reminder emails sent.`;
        console.log(`Cron job finished: ${summary}`);
        return NextResponse.json({ message: summary });

    } catch (error) {
        console.error("Cron job (invoicing) failed:", error);
        return NextResponse.json({ error: 'Failed to process invoices.' }, { status: 500 });
    }
}