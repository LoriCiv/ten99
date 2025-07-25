import { NextResponse } from 'next/server';
import { simpleParser } from 'mailparser';
import { db } from '@/lib/firebase-admin';
import type { UserProfile, Appointment, Message } from '@/types/app-interfaces';
// ✅ FIX: Changed import from 'serverTimestamp' to 'FieldValue'
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const getRecipientUserId = (toAddress: string): string | null => {
    const username = toAddress.split('@')[0];
    if (username === 'magic') {
        return "dev-user-1";
    }
    return null;
};

// Main function to handle incoming POST requests from SendGrid
export async function POST(req: Request) {
    try {
        console.log("[Step 0] Inbound Email Function Triggered ---");
        const formData = await req.formData();
        const emailBody = formData.get('email') as string;

        if (!emailBody) {
            return NextResponse.json({ error: 'No email content found.' }, { status: 400 });
        }
        
        const parsedEmail = await simpleParser(emailBody);
        console.log("[Step 0] Received Request from SendGrid");

        const fromAddress = parsedEmail.from?.value[0]?.address || 'unknown';
        const toAddress = parsedEmail.to?.value[0]?.address || 'unknown';
        const subject = parsedEmail.subject || 'No Subject';
        const body = parsedEmail.text || '';
        
        const recipientUserId = getRecipientUserId(toAddress);
        if (!recipientUserId) {
            throw new Error(`Could not determine recipient user from address: ${toAddress}`);
        }

        const profileRef = db.doc(`users/${recipientUserId}/profile/mainProfile`);
        const profileSnap = await profileRef.get();
        const userProfile = profileSnap.data() as UserProfile | undefined;
        
        const isFromDefaultEmail = userProfile?.defaultForwardingEmail && userProfile.defaultForwardingEmail.toLowerCase() === fromAddress.toLowerCase();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `From the following email text, extract the event subject, date (in YYYY-MM-DD format), and time (in HH:MM 24-hour format). If any detail is missing, provide a reasonable default. Respond ONLY with a valid JSON object like this: {"subject": "Event Subject", "date": "YYYY-MM-DD", "time": "HH:MM"}\n\nEmail Text:\n"""${body}"""`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const parsedDetails = JSON.parse(text);

        if (isFromDefaultEmail) {
            const newAppointment: Omit<Appointment, 'id'> = {
                userId: recipientUserId,
                subject: parsedDetails.subject || 'New Appointment',
                date: parsedDetails.date || new Date().toISOString().split('T')[0],
                time: parsedDetails.time || '12:00',
                eventType: 'job',
                status: 'scheduled',
                createdAt: FieldValue.serverTimestamp(), // ✅ FIX: Used FieldValue.serverTimestamp()
                notes: `Automatically booked from forwarded email.\n\n--- Original Email ---\nFrom: ${fromAddress}\nSubject: ${subject}\n\n${body}`
            };
            await db.collection(`users/${recipientUserId}/appointments`).add(newAppointment);
        } else {
            const newMessage: Omit<Message, 'id'> = {
                userId: recipientUserId,
                senderId: fromAddress,
                senderName: parsedEmail.from?.value[0]?.name || fromAddress,
                recipientId: recipientUserId,
                subject: `Job Offer: ${subject}`,
                body: body,
                isRead: false,
                status: 'new',
                createdAt: FieldValue.serverTimestamp(), // ✅ FIX: Used FieldValue.serverTimestamp()
                proposedDate: parsedDetails.date,
                proposedTime: parsedDetails.time,
            };
            await db.collection(`users/${recipientUserId}/messages`).add(newMessage);
        }

        return NextResponse.json({ message: 'Email processed successfully.' }, { status: 200 });

    } catch (error) {
        console.error('[FATAL ERROR] Inbound email processing failed:', error);
        return NextResponse.json({ error: `Inbound email processing failed: ${error}` }, { status: 500 });
    }
}