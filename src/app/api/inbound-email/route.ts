// src/app/api/inbound-email/route.ts
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin'; // Use default import

const db = admin.firestore(); // Get firestore from the admin object

// This function can be expanded later
const findRecipientUserId = async (toEmail: string): Promise<string | null> => {
    // For now, all inbound emails go to our dev user
    return "dev-user-1";
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const from = formData.get('from') as string;
        const to = formData.get('to') as string;
        // ... other fields

        const recipientId = await findRecipientUserId(to);

        if (!recipientId) {
            return NextResponse.json({ message: 'Recipient not found.' });
        }
        
        // Your existing logic...
        const newMessage = {
            // ...data
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('users').doc(recipientId).collection('messages').add(newMessage);
        
        return NextResponse.json({ message: 'Email processed.' });

    } catch (error) {
        console.error("Inbound email error:", error);
        return NextResponse.json({ error: 'Failed to process email.' }, { status: 500 });
    }
}