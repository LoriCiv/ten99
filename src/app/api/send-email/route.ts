import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(req: Request) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
        console.error("SENDGRID_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }
    sgMail.setApiKey(apiKey);

    try {
        // We now expect 'replyToEmail' in the request
        const { fromName, to, subject, html, replyToEmail } = await req.json();

        // This is your verified professional email address.
        const fromEmail = "support@ten99.app"; 

        const fullHtml = `
            ${html}
            <br><br>
            <p style="font-size: 12px; color: #888;">
                You received this email from ${fromName} via the Ten99 App.
            </p>
        `;

        const msg = {
            to: to,
            from: {
                email: fromEmail,
                name: `${fromName} (via Ten99)`,
            },
            subject: subject,
            html: fullHtml,
            // When the recipient replies, it will go to the actual user's email
            replyTo: replyToEmail, 
        };

        await sgMail.send(msg);

        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}