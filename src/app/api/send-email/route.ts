// src/app/api/send-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';
import type { UserProfile } from '@/types/app-interfaces';

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn("SENDGRID_API_KEY is not set. Emails will not be sent.");
}

export async function POST(request: NextRequest) {
    if (!process.env.SENDGRID_API_KEY) {
        return NextResponse.json({ error: 'Server not configured for sending email.' }, { status: 500 });
    }

    try {
        const { userId, to, subject, html, replyToEmail } = await request.json();
        
        if (!userId || !to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields for sending email.' }, { status: 400 });
        }

        initializeFirebaseAdmin();
        const db = getFirestore();
        
        // Fetch the sender's profile to get their name
        const userProfileRef = db.doc(`users/${userId}`);
        const userProfileSnap = await userProfileRef.get();
        if (!userProfileSnap.exists) {
            return NextResponse.json({ error: 'Sender profile not found.' }, { status: 404 });
        }
        const user = userProfileSnap.data() as UserProfile;
        const fromName = user.name || 'A Ten99 User';

        const msg = {
            to: to, // `to` can be a single email or an array of emails
            from: {
                email: 'messages@ten99.app', // A verified sender address
                name: fromName,
            },
            replyTo: replyToEmail || user.email, // Use the user's actual email for replies
            subject: subject,
            html: html,
        };

        await sgMail.send(msg);
        
        return NextResponse.json({ success: true, message: 'Email sent successfully.' });

    } catch (error) {
        console.error("Error in send-email API:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 });
    }
}