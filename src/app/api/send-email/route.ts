// src/app/api/send-email/route.ts

import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set the API key from your environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { fromName, to, subject, html } = await request.json();

    const msg = {
      to: to,
      // ✅ THIS IS THE FIX: We are using a professional email from your verified domain.
      from: {
          name: fromName,
          // You can use any address from your domain, e.g., "contact", "hello", etc.
          email: 'noreply@ten99.app' 
      },
      subject: subject,
      html: html,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error("SendGrid API Error:", error);
    if (error instanceof Error && 'response' in error) {
        const sgError = error as any;
        console.error(sgError.response.body);
        return NextResponse.json({ error: sgError.response.body }, { status: 500 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}