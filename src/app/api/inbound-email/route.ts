// src/app/api/inbound-email/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Message, Client, Appointment } from '@/types/app-interfaces';
import { FieldValue } from 'firebase-admin/firestore';

// --- HELPER FUNCTIONS ---

const parseFromHeader = (from: string): { name: string; email: string } => {
    const match = from.match(/(.*)<(.*)>/);
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: from, email: from };
};

const findRecipientUserId = async (toEmail: string): Promise<string | null> => {
    if (toEmail.startsWith("inbound@")) { // Catch-all for our inbound domain
        return "dev-user-1";
    }
    return null;
};

// --- START OF NEW AI LOGIC ---

async function getClientsForAI(userId: string): Promise<{ id: string, name: string }[]> {
    const clientsSnapshot = await db.collection(`users/${userId}/clients`).get();
    if (clientsSnapshot.empty) {
        return [];
    }
    return clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, name: data.companyName || data.name };
    });
}

async function parseEmailWithAI(userId: string, emailBody: string, emailSubject: string): Promise<Partial<Appointment> | null> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Gemini API key is not configured.");
        return null;
    }

    const clientListForAI = await getClientsForAI(userId);

    const prompt = `
        You are an expert scheduling assistant. Your task is to extract appointment details from an email.
        Respond ONLY with a single valid JSON object. DO NOT include explanations, comments, or markdown.

        ### REQUIRED FORMAT:
        {
          "subject": "Short appointment title",
          "date": "YYYY-MM-DD",
          "time": "HH:MM",
          "endTime": "HH:MM",
          "clientId": "matched_client_id_if_found",
          "newClientName": "New Company Inc. if not in list",
          "locationType": "physical or virtual",
          "address": "Full location address or virtual link",
          "jobNumber": "Any ID like Job#, Assignment #, etc."
        }

        ### Rules:
        - Analyze the "subject" and "body" of the email provided.
        - Match client names from the provided list. If a client is matched, use its ID for "clientId".
        - If the client is NOT in the list, extract the company name into "newClientName".
        - If you see "Job #", "Assignment #", "Request #", or any similar identifier, extract the number for "jobNumber".
        - If the location seems like a URL or mentions "Remote" or "Video", set locationType to "virtual". Otherwise, set it to "physical".
        - Leave any field null if the information is missing.

        ### Client List:
        ${JSON.stringify(clientListForAI, null, 2)}

        ### Email to Analyze:
        Subject: ${emailSubject}
        Body: ${emailBody}
    `.trim();

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("AI API Error:", errorBody);
            return null;
        }

        const result = await response.json();
        let rawJson = result.candidates[0].content.parts[0].text;
        
        if (rawJson.startsWith("```json")) {
            rawJson = rawJson.replace(/^```json\n/, '').replace(/\n```$/, '');
        }

        const parsedData = JSON.parse(rawJson);
        
        if (parsedData.newClientName && !parsedData.clientId) {
            const newClientData: Partial<Client> = {
                companyName: parsedData.newClientName,
                name: parsedData.newClientName,
                status: 'Active',
                clientType: 'business_1099'
            };
            const clientRef = await db.collection(`users/${userId}/clients`).add({
                ...newClientData,
                createdAt: FieldValue.serverTimestamp()
            });
            parsedData.clientId = clientRef.id;
        }
        
        return parsedData;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown AI parsing error";
        console.error("Error during AI parsing in webhook:", errorMessage);
        return null;
    }
}

// --- END OF NEW AI LOGIC ---


export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const from = formData.get('from') as string;
        const to = formData.get('to') as string;
        const subject = formData.get('subject') as string;
        const body = formData.get('text') as string;

        if (!from || !to || !subject || !body) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const recipientId = await findRecipientUserId(to);

        if (!recipientId) {
            console.log("Could not find a recipient user for email to:", to);
            return NextResponse.json({ message: 'Recipient not found, but accepted.' }, { status: 200 });
        }

        const senderInfo = parseFromHeader(from);
        
        const appointmentDetails = await parseEmailWithAI(recipientId, body, subject);

        const newMessage: Omit<Message, 'id'> = {
            userId: recipientId,
            recipientId: recipientId,
            senderId: senderInfo.email,
            senderName: senderInfo.name,
            subject: subject,
            body: body,
            isRead: false,
            status: 'new',
            // ✅ THE FIX: Removed the unnecessary 'as any' cast
            createdAt: FieldValue.serverTimestamp(),
            proposedDate: appointmentDetails?.date || undefined,
            proposedTime: appointmentDetails?.time || undefined,
        };

        await db.collection('users').doc(recipientId).collection('messages').add(newMessage);

        console.log("Inbound email processed and saved as a message for user:", recipientId);
        return NextResponse.json({ message: 'Email processed successfully' }, { status: 200 });

    } catch (error) {
        console.error("Inbound Parse Webhook Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}