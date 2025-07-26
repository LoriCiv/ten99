import { NextResponse, type NextRequest } from 'next/server';
import { simpleParser } from 'mailparser';
import { addAppointment, addClient, getProfileData } from '@/utils/firestoreService';
import type { Appointment, Client } from '@/types/app-interfaces';

// Helper function to call the Gemini API
async function parseEmailWithAI(emailBody: string, clientList: {id?: string, name?: string}[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }
    const prompt = `
        You are an intelligent scheduling assistant. Parse the text to extract appointment details.
        Today's Date: ${new Date().toLocaleDateString()}
        Existing Clients: ${JSON.stringify(clientList)}
        
        Instructions:
        1. Extract details into a JSON object with fields: "subject", "date" (YYYY-MM-DD), "time" (HH:mm), "clientId" (if a name matches the Existing Clients list), "newClientName" (if no client matches), "notes".
        2. If a date is mentioned without a year, assume the current year.
        3. Respond with ONLY the valid JSON object.
        
        TEXT TO PARSE:
        ${emailBody}
    `;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error("API request failed");
    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text;
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
}


export async function POST(request: NextRequest) {
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (webhookSecret && request.headers.get('X-SendGrid-Signature') !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const to = formData.get('to') as string;
        const from = formData.get('from') as string;
        const emailContent = formData.get('email') as string;

        if (!to || !emailContent) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }
        
        // Extract the core email address from a string like "Name <email@example.com>"
        const toEmailAddress = to.split('<').pop()?.split('>')[0].trim();
        if (!toEmailAddress || !toEmailAddress.includes('@')) {
            return NextResponse.json({ error: 'Invalid "to" address format.' }, { status: 400 });
        }

        // ✅ THE MAGIC: The user's ID is the part of the email before the "@"
        const userId = toEmailAddress.split('@')[0];

        if (!userId) {
            console.error(`Could not extract userId from inbound address: ${toEmailAddress}`);
            return NextResponse.json({ error: 'Could not identify user from address.' }, { status: 400 });
        }

        // Now we use the real userId to fetch the user's profile and clients
        const userProfile = await getProfileData(userId);
        // Note: We'd need a server-side getClientsData function here. For now, we'll proceed without it for the AI context.

        const parsedEmail = await simpleParser(emailContent);
        const emailBody = parsedEmail.text || '';

        // The AI parsing and appointment creation logic now uses the real userId
        const aiResult = await parseEmailWithAI(emailBody, []); // Pass client list if available
        
        let clientId = aiResult.clientId;
        if (aiResult.newClientName && !clientId) {
            const newClientData: Partial<Client> = { name: aiResult.newClientName, companyName: aiResult.newClientName, status: 'Lead', clientType: 'business_1099' };
            const newClientRef = await addClient(userId, newClientData);
            clientId = newClientRef.id;
        }

        const appointmentData: Partial<Appointment> = {
            subject: `Pending: ${aiResult.subject || 'New Appointment'}`,
            date: aiResult.date,
            time: aiResult.time,
            notes: aiResult.notes || emailBody,
            clientId: clientId,
            status: 'pending-confirmation',
            eventType: 'job',
        };
        
        await addAppointment(userId, appointmentData);

        return NextResponse.json({ success: true, message: "Appointment created pending confirmation." });

    } catch (error) {
        console.error("Inbound email webhook error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to process inbound email.", details: errorMessage }, { status: 500 });
    }
}