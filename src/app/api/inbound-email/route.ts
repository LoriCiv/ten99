// src/app/api/inbound-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    addMessage,
    addAppointment,
    updateMessage,
} from '@/utils/firestoreService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message, Appointment } from '@/types/app-interfaces';

const extractJson = (text: string): unknown => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        try { return JSON.parse(match[1]); }
        catch (e) { console.error("Failed to parse JSON from markdown block:", e); }
    }
    try { return JSON.parse(text); }
    catch(e) { console.error("Failed to parse the entire text as JSON:", e); }
    return null;
};

type AiResponse = {
    senderName: string;
    subject: string;
    body: string;
    isAppointmentRequest: boolean;
    proposedDate?: string;
    proposedTime?: string;
};

export async function POST(request: NextRequest) {
    const TEMP_USER_ID = "dev-user-1";

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const emailData = {
            from: formData.get('from') as string || '',
            subject: formData.get('subject') as string || '',
            text: formData.get('text') as string || '',
        };

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Analyze the email below. Determine if it's an appointment request. Extract the sender's name, a subject, the full body, a proposed date (YYYY-MM-DD), and time (HH:MM 24-hour).
Respond ONLY with a valid JSON object:
{
  "senderName": "John Doe",
  "subject": "Meeting Request",
  "body": "...",
  "isAppointmentRequest": true,
  "proposedDate": "2025-08-15",
  "proposedTime": "14:30"
}
If it is not an appointment request, set "isAppointmentRequest" to false.

Email Content:
From: ${emailData.from}
Subject: ${emailData.subject}

${emailData.text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsedContent = extractJson(responseText) as AiResponse;

        if (!parsedContent) {
            throw new Error("AI parsing failed to produce valid JSON.");
        }

        const messageData: Partial<Message> = {
            senderId: emailData.from,
            senderName: parsedContent.senderName || emailData.from,
            recipientId: TEMP_USER_ID,
            subject: parsedContent.subject || emailData.subject,
            body: parsedContent.body || emailData.text,
            isRead: false,
            status: 'new',
            type: parsedContent.isAppointmentRequest ? 'inbound-offer' : 'standard',
            proposedDate: parsedContent.proposedDate || undefined,
            proposedTime: parsedContent.proposedTime || undefined,
        };

        const messageId = await addMessage(TEMP_USER_ID, messageData);
        
        if (parsedContent.isAppointmentRequest && messageData.proposedDate && messageData.proposedTime) {
            const appointmentData: Partial<Appointment> = {
                eventType: 'job',
                subject: `Pending: ${messageData.subject}`,
                status: 'pending-confirmation',
                date: messageData.proposedDate,
                time: messageData.proposedTime,
                notes: `Proposed via email from ${messageData.senderName}.\n\n---Original Message---\n${messageData.body}`,
                userId: TEMP_USER_ID,
            };
            
            const appointmentId = await addAppointment(TEMP_USER_ID, appointmentData);

            if (appointmentId) {
                await updateMessage(TEMP_USER_ID, messageId, { appointmentId: appointmentId });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Inbound Email Route Error:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}