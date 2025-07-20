// src/app/api/send-receipt/route.ts
import { Resend } from 'resend';
import ReceiptEmail from '@/emails/ReceiptEmail';
import { NextResponse } from 'next/server';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { invoice, client, user } = await request.json() as { invoice: Invoice, client: Client, user: UserProfile };

    const recipientEmail = client.billingEmail || client.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Client has no email address on file.' }, { status: 400 });
    }
    
    const subject = `Receipt for Invoice #${invoice.invoiceNumber}`;

    const { data, error } = await resend.emails.send({
      from: 'receipts@ten99.app', // Must be a verified domain on Resend
      to: [recipientEmail],
      subject: subject,
      react: ReceiptEmail({ invoice, client, user }),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Receipt sent successfully!', data });

  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
  }
}