// src/app/api/inbound-email/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
// ✅ Use the correct 'mailparser' library
import { simpleParser } from 'mailparser';

const findRecipientUserId = async (toEmail: string): Promise<string | null> => {
    console.log(`Looking for user associated with: ${toEmail}`);
    return "dev-user-1"; 
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        // --- SendGrid sends data in specific fields ---
        const from = formData.get('from') as string;
        const to = formData.get('to') as string;
        const subject = formData.get('subject') as string;
        const body = formData.get('text') as string; // Plain text version of the body
        const email = formData.get('email') as string; // The full raw email
        
        if (!email) {
            throw new Error("No raw email content found in webhook payload.");
        }

        // Parse the 'to' address to find our target user
        const parsedToHeader = await simpleParser(to);
        const recipientEmail = parsedToHeader.to?.value[0]?.address || '';
        const recipientId = await findRecipientUserId(recipientEmail);

        if (!recipientId) {
            console.log(`Recipient not found for email: ${recipientEmail}`);
            return NextResponse.json({ message: 'Recipient not found, but acknowledged.' });
        }
        
        // Parse the 'from' address to get sender details
        const parsedFromHeader = await simpleParser(from);
        const senderName = parsedFromHeader.from?.value[0]?.name || from;
        const senderEmail = parsedFromHeader.from?.value[0]?.address || from;

        const newMessage = {
            senderName: senderName,
            senderId: senderEmail,
            recipientId: recipientId,
            subject: subject,
            body: body,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            status: 'new',
        };

        await db.collection('users').doc(recipientId).collection('messages').add(newMessage);
        
        console.log(`Successfully processed inbound email from ${senderEmail} to ${recipientEmail}`);
        return NextResponse.json({ message: 'Email processed successfully.' });

    } catch (error) {
        console.error("Inbound email processing error:", error);
        return NextResponse.json({ error: 'Failed to process email.' }, { status: 500 });
    }
}