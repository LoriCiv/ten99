// src/app/api/send-invoice/route.ts
import { Resend } from 'resend';
import InvoiceEmail from '@/emails/InvoiceEmail';
import { NextResponse } from 'next/server';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { invoice, client, user } = await request.json() as { invoice: Invoice, client: Client, user: UserProfile };

    if (!client.billingEmail && !client.email) {
      return NextResponse.json({ error: 'Client has no email address on file.' }, { status: 400 });
    }
    
    const recipientEmail = client.billingEmail || client.email;
    const subject = `Invoice #${invoice.invoiceNumber} from ${user.professionalTitle || 'Your Name'}`;

    const { data, error } = await resend.emails.send({
      from: 'invoices@ten99.app', // This must be a verified domain on Resend
      to: [recipientEmail!],
      subject: subject,
      react: InvoiceEmail({ invoice, client, user }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully!', data });

  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
  }
}
