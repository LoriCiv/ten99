import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { to, subject, html, fromName } = await request.json();

    if (!to || !subject || !html || !fromName) {
        return NextResponse.json({ error: 'Missing required fields: to, subject, html, fromName' }, { status: 400 });
    }

    const msg = {
        to: to,
        // Use a verified sender from your SendGrid account
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
    const error = err as Error & { response?: { body: any } };
    console.error("API error sending email:", error.response?.body || error.message);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}