// src/app/api/inbound-email/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const findRecipientUserId = async (toEmail: string): Promise<string | null> => {
    console.log(`[Step 1] Looking for user associated with: ${toEmail}`);
    // For now, we are hardcoding this to our dev user.
    return "dev-user-1"; 
};

const parseFromHeader = (fromHeader: string): { name: string; email: string } => {
    const match = fromHeader.match(/(.*)<(.*)>/);
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: fromHeader, email: fromHeader };
};

export async function POST(request: Request) {
    console.log("--- Inbound Email Function Triggered ---");
    try {
        const formData = await request.formData();
        console.log("[Step 0] Received request from SendGrid.");
        
        const from = formData.get('from') as string;
        const to = formData.get('to') as string;
        const subject = formData.get('subject') as string;
        const body = formData.get('text') as string;
        
        console.log(`[Data Check] From: ${from}`);
        console.log(`[Data Check] To: ${to}`);
        console.log(`[Data Check] Subject: ${subject}`);
        
        if (!to || !from || !subject || !body) {
            console.error("[ERROR] Webhook payload is missing one or more required fields.");
            throw new Error("Webhook payload is missing required fields.");
        }

        const recipientId = await findRecipientUserId(to);

        if (!recipientId) {
            console.warn(`[Step 2 - FAIL] Recipient not found for email: ${to}. Discarding email.`);
            return NextResponse.json({ message: 'Recipient not found, but acknowledged.' });
        }
        console.log(`[Step 2 - SUCCESS] Found recipient user ID: ${recipientId}`);
        
        const { name: senderName, email: senderEmail } = parseFromHeader(from);
        console.log(`[Step 3] Parsed sender info: Name='${senderName}', Email='${senderEmail}'`);

        const newMessage = {
            senderName: senderName,
            senderId: senderEmail,
            recipientId: recipientId,
            subject: subject,
            body: body,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            status: 'new' as const,
        };

        console.log("[Step 4] Preparing to save the following message object to Firestore:", newMessage);

        const messageRef = await db.collection('users').doc(recipientId).collection('messages').add(newMessage);
        console.log(`[Step 5 - SUCCESS] Successfully saved new message with ID: ${messageRef.id}`);

        return NextResponse.json({ message: 'Email received and saved successfully.' });

    } catch (error) {
        console.error("[FATAL ERROR] Inbound email processing failed:", error);
        return NextResponse.json({ error: 'Failed to process email.' }, { status: 500 });
    }
}