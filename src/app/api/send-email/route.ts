// src/app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { to, subject, html, fromName } = await request.json();

    if (!to || !subject || !html || !fromName) {
        return NextResponse.json({ error: 'Missing required fields: to, subject, html, fromName' }, { status: 400 });
    }

    const msg = {
        to: to,
        from: {
            email: 'system@ten99.app',
            name: fromName,
        },
        subject: subject,
        html: html,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: 'Email sent successfully!' });

  } catch (err) {
    // ✅ UPDATED: More specific error handling to satisfy the linter
    console.error("API error sending email:", err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 500 });
  }
}