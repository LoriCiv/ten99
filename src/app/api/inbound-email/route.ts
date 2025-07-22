// src/app/api/inbound-email/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // ✅ FIX: Use named import
import { FieldValue } from 'firebase-admin/firestore';

const findRecipientUserId = async (toEmail: string): Promise<string | null> => {
    return "dev-user-1";
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const from = formData.get('from') as string;
        const recipientId = await findRecipientUserId(formData.get('to') as string);

        if (!recipientId) {
            return NextResponse.json({ message: 'Recipient not found.' });
        }
        
        const newMessage = {
            senderName: from, senderId: from, recipientId: recipientId,
            subject: formData.get('subject') as string,
            body: formData.get('text') as string,
            isRead: false, createdAt: FieldValue.serverTimestamp(),
        };

        await db.collection('users').doc(recipientId).collection('messages').add(newMessage);
        return NextResponse.json({ message: 'Email processed.' });

    } catch (error) {
        console.error("Inbound email error:", error);
        return NextResponse.json({ error: 'Failed to process email.' }, { status: 500 });
    }
}