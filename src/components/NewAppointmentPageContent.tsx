"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getClients, getPersonalNetwork, getJobFiles, addAppointment, getAppointments, addClient } from '@/utils/firestoreService';
import AppointmentForm from '@/components/AppointmentForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Define the props the component will accept
interface NewAppointmentPageContentProps {
    userId: string;
}

// Accept the userId as a prop
export default function NewAppointmentPageContent({ userId }: NewAppointmentPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pastedText, setPastedText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [aiMessage, setAiMessage] = useState('');
    const initialDate = searchParams.get('date');
    const [prefilledData, setPrefilledData] = useState<Partial<Appointment> | undefined>(
        initialDate ? { date: initialDate } : undefined
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(() => {
        const unsubClients = getClients(userId, setClients);
        const unsubContacts = getPersonalNetwork(userId, setContacts);
        const unsubJobFiles = getJobFiles(userId, setJobFiles);
        const unsubAppointments = getAppointments(userId, (data) => {
            setAllAppointments(data);
            setIsLoading(false);
        });
        return () => { unsubClients(); unsubContacts(); unsubJobFiles(); unsubAppointments(); };
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleParseWithAI = async () => {
        if (!pastedText.trim()) {
            setAiMessage('Please paste some text to parse.');
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            setAiMessage("Error: Gemini API key is not configured.");
            return;
        }

        setIsParsing(true);
        setAiMessage('AI is parsing the text...');
        setPrefilledData(undefined);

        const clientListForAI = clients.map(c => ({ id: c.id, name: c.companyName || c.name }));

        const prompt = `
You are an intelligent scheduling assistant. Parse the text below and convert it into a structured JSON object adhering to the schema.

CONTEXT:
- Today's Date: ${new Date().toLocaleDateString()}
- Existing Clients List: ${JSON.stringify(clientListForAI)}

INSTRUCTIONS:
1.  Analyze the 'TEXT TO PARSE' below.
2.  Extract details, inferring a 'subject' if needed. Look for "Situation:", "Job#", "City Name:", "Site Zip Code:".
3.  **Company Name:** Find the company name in the "From:" line (e.g., "From: GISN <...>").
4.  **Client Matching:** If a parsed company name matches an existing client, use their 'id' for 'clientId'. Otherwise, create a 'newClientName' field.
5.  **Formatting:** Dates must be 'YYYY-MM-DD', and times must be 24-hour 'HH:mm'.
6.  **Output:** Respond with ONLY the valid JSON object.

JSON SCHEMA:
{
  "subject": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "endTime": "HH:mm" | null,
  "clientId": "string" | null,
  "newClientName": "string" | null,
  "jobNumber": "string" | null,
  "notes": "string" | null,
  "address": "string" | null,
  "city": "string" | null,
  "state": "string" | null,
  "zip": "string" | null,
  "locationType": "physical" | "virtual" | null
}

EXAMPLE:
---
TEXT TO PARSE:
From: GISN <request@gisn.info>
Date: Sat, Jul 26, 2025 at 12:01 PM
Job# 1137445 Session# 5090723
Situation: Onsite(Teamed): School Improvement Plan Stake Holder Meeting
City Name: Cave Springs
Site Zip Code: 30124
---
EXPECTED JSON OUTPUT:
{
  "subject": "Onsite(Teamed): School Improvement Plan Stake Holder Meeting",
  "date": "2025-07-26",
  "time": "12:01",
  "endTime": null,
  "newClientName": "GISN",
  "jobNumber": "1137445",
  "notes": "Session# 5090723",
  "city": "Cave Springs",
  "zip": "30124",
  "locationType": "physical"
}
---

TEXT TO PARSE:
${pastedText}
`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) { throw new Error(`API request failed: ${response.status} ${response.statusText}`); }
            const result = await response.json();
            if (!result.candidates?.length) { throw new Error("AI response was empty or blocked."); }
            
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) { throw new Error("No valid JSON object found in AI response."); }
            
            const jsonString = rawText.substring(jsonStart, jsonEnd + 1);
            const parsedJson = JSON.parse(jsonString);

            if (parsedJson.newClientName && !parsedJson.clientId) {
                const newClientRef = await addClient(userId, {
                    companyName: parsedJson.newClientName,
                    name: parsedJson.newClientName,
                    status: 'Active',
                    clientType: 'business_1099'
                });
                parsedJson.clientId = newClientRef.id;
            }
            
            setPrefilledData(parsedJson);
            setAiMessage('Success! Form has been pre-filled below.');

        } catch (error) {
            console.error("AI Parsing Error:", error);
            setAiMessage(`Error parsing AI response. ${error instanceof Error ? error.message : ''}`);
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleSaveAppointment = async (appointmentData: Partial<Appointment>, recurrenceEndDate?: string) => {
        setIsSubmitting(true);
        if (!appointmentData.date || !appointmentData.time) {
            alert("Date and Time are required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const newStart = new Date(`${appointmentData.date}T${appointmentData.time}`);
            const newEnd = appointmentData.endTime ? new Date(`${appointmentData.date}T${appointmentData.endTime}`) : new Date(newStart.getTime() + 60 * 60 * 1000);

            const conflict = allAppointments.find(existing => {
                if (!existing.date || !existing.time || existing.id === appointmentData.id || existing.date !== appointmentData.date) return false;
                const existStart = new Date(`${existing.date}T${existing.time}`);
                const existEnd = existing.endTime ? new Date(`${existing.date}T${existing.endTime}`) : new Date(existStart.getTime() + 60 * 60 * 1000);
                return newStart < existEnd && newEnd > existStart;
            });

            if (conflict) {
                alert(`⚠️ Conflict: "${conflict.subject}" at ${conflict.time}.`);
                setIsSubmitting(false);
                return;
            }
            
            await addAppointment(userId, appointmentData, recurrenceEndDate);
            alert("✅ Appointment Saved!");
            router.push('/dashboard/appointments');
        } catch (error) {
            console.error("Error saving appointment:", error);
            alert("❌ Failed to save appointment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Link href="/dashboard/appointments" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Calendar
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Create from Text (AI Powered)</h2>
                        <div className="bg-card p-6 rounded-lg shadow-lg border">
                            <textarea
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                                placeholder="Paste email or text here..."
                                className="w-full h-40 p-3 border rounded-md bg-background"
                            ></textarea>
                            <button 
                                onClick={handleParseWithAI} 
                                disabled={isParsing} 
                                className="w-full mt-4 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-500 flex items-center justify-center gap-2"
                            >
                                {isParsing && <Loader2 className="h-5 w-5 animate-spin" />}
                                {isParsing ? 'Parsing...' : 'Parse with AI'}
                            </button>
                            {aiMessage && <p className="text-sm mt-2 text-center text-muted-foreground">{aiMessage}</p>}
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4">Enter Manually</h2>
                    <AppointmentForm
                        onCancel={() => router.push('/dashboard/appointments')}
                        onSave={handleSaveAppointment}
                        clients={clients}
                        contacts={contacts}
                        jobFiles={jobFiles}
                        initialData={prefilledData}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}