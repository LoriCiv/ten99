// src/app/dashboard/appointments/new/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getClients, getPersonalNetwork, getJobFiles, addAppointment, getAppointments, addClient } from '@/utils/firestoreService';
import AppointmentForm from '@/components/AppointmentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TEMP_USER_ID = "dev-user-1";

const calculateEndTime = (startTime: string, durationInMinutes: number): string => {
    if (!startTime || !durationInMinutes) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationInMinutes * 60000);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
};

function NewAppointmentPageInternal() {
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
        const userId = TEMP_USER_ID;
        const unsubClients = getClients(userId, setClients);
        const unsubContacts = getPersonalNetwork(userId, setContacts);
        const unsubJobFiles = getJobFiles(userId, setJobFiles);
        const unsubAppointments = getAppointments(userId, (data) => {
            setAllAppointments(data);
            setIsLoading(false);
        });
        return () => { unsubClients(); unsubContacts(); unsubJobFiles(); unsubAppointments(); };
    }, []);

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [fetchData]);

    const handleParseWithAI = async () => {
        if (!pastedText.trim()) return setAiMessage('Please paste some text to parse.');

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) return setAiMessage("Error: Gemini API key is not configured.");

        setIsParsing(true);
        setAiMessage('AI is parsing the text...');
        setPrefilledData(undefined);

        const clientListForAI = clients.map(c => ({ id: c.id, name: c.companyName || c.name }));

        // ✅ THIS IS THE NEW, SMARTER PROMPT
        const prompt = `You are a highly intelligent scheduling assistant. Your task is to meticulously extract appointment details from unstructured text and respond ONLY with a single, valid JSON object. Do not include any conversational text, markdown, or comments outside of the JSON.

        ### JSON OUTPUT FORMAT:
        {
          "subject": "A concise title for the appointment",
          "date": "YYYY-MM-DD",
          "time": "HH:MM",
          "endTime": "HH:MM",
          "clientId": "ID of an existing client if matched, otherwise null",
          "newClientName": "Company name if it's a new client, otherwise null",
          "locationType": "'physical' or 'virtual'",
          "address": "Full physical address OR the virtual meeting platform (e.g., 'Zoom', '3rd Party Video')",
          "jobNumber": "The job, assignment, or appointment number"
        }

        ### EXISTING CLIENTS LIST:
        ${JSON.stringify(clientListForAI, null, 2)}

        ### PARSING RULES:
        1.  **Job Number:** Look for "Assignment #", "Job #", "Appointment #", "Request #", "Job Number", or "Session #". Extract the number that follows and place it in the "jobNumber" field.
        2.  **Location:** If the text mentions "Remote", "Virtual", "3rd Party Video", "Zoom", "Google Meet", or similar terms, set "locationType" to "virtual". Otherwise, set it to "physical".
        3.  **Client Identification:**
            - First, try to match a company name from the EXISTING CLIENTS LIST. If a match is found, use its ID for the "clientId" field and leave "newClientName" as null.
            - If no match is found, look at the "From:" line. Extract the company name (e.g., from "From: Partners Interpreting <services@...") and put it in the "newClientName" field. Leave "clientId" as null.
        4.  **Dates & Times:** Always use the specified year. If no year is specified, assume the current year (${new Date().getFullYear()}). Convert all times to 24-hour format (e.g., 1:30 PM becomes 13:30).

        ### ANALYZE THIS TEXT:
        ${pastedText}`.trim();

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API request failed: ${response.status}`);

            const result = await response.json();
            let rawText = result.candidates[0].content.parts[0].text;

            let cleanText = rawText.replace(/```json\n/g, '').replace(/\n```/g, '');
            const jsonStart = cleanText.indexOf('{');
            const jsonEnd = cleanText.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error("No valid JSON object found in the AI's response.");
            }

            const jsonString = cleanText.substring(jsonStart, jsonEnd + 1);
            const parsedJson = JSON.parse(jsonString);

            if (parsedJson.newClientName && !parsedJson.clientId) {
                const newClientData: Partial<Client> = {
                    companyName: parsedJson.newClientName,
                    name: parsedJson.newClientName,
                    status: 'Active',
                    clientType: 'business_1099'
                };
                const newClientRef = await addClient(TEMP_USER_ID, newClientData);
                parsedJson.clientId = newClientRef.id;
                fetchData();
            }

            if (parsedJson.time && parsedJson.durationInMinutes && !parsedJson.endTime) {
                parsedJson.endTime = calculateEndTime(parsedJson.time, parsedJson.durationInMinutes);
            }

            setPrefilledData(parsedJson);
            setAiMessage('Success! Form has been pre-filled.');
        } catch (error) {
            console.error("AI Parsing Error:", error);
            setAiMessage("Error parsing AI response. Check console for details.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleSaveAppointment = async (appointmentData: Partial<Appointment>) => {
        setIsSubmitting(true);

        if (!appointmentData.date || !appointmentData.time) {
            alert("Date and Time are required to check for conflicts.");
            setIsSubmitting(false);
            return;
        }

        const seriesId = appointmentData.recurrence ? crypto.randomUUID() : undefined;

        try {
            const newStart = new Date(`${appointmentData.date}T${appointmentData.time}`);
            const newEnd = appointmentData.endTime
                ? new Date(`${appointmentData.date}T${appointmentData.endTime}`)
                : new Date(newStart.getTime() + 60 * 60 * 1000);

            newStart.setSeconds(0, 0);
            newEnd.setSeconds(0, 0);

            const conflict = allAppointments.find(existing => {
                if (!existing.date || !existing.time) return false;
                if (existing.date !== appointmentData.date) return false;

                const existStart = new Date(`${existing.date}T${existing.time}`);
                const existEnd = existing.endTime
                    ? new Date(`${existing.date}T${existing.endTime}`)
                    : new Date(existStart.getTime() + 60 * 60 * 1000);

                existStart.setSeconds(0, 0);
                existEnd.setSeconds(0, 0);

                return newStart < existEnd && newEnd > existStart;
            });

            if (conflict) {
                alert(`⚠️ Conflict: "${conflict.subject}" at ${conflict.time}. Please choose a different time.`);
                setIsSubmitting(false);
                return;
            }

            const firstAppointmentData = { ...appointmentData, seriesId };
            await addAppointment(TEMP_USER_ID, firstAppointmentData);

            if (appointmentData.recurrence && seriesId) {
                const recurrenceCount = 4;
                const recurrenceIntervalDays = appointmentData.recurrence === 'daily' ? 1
                    : appointmentData.recurrence === 'weekly' ? 7
                    : appointmentData.recurrence === 'biweekly' ? 14
                    : 30;

                const originalDate = new Date(`${appointmentData.date}T00:00`);

                for (let i = 1; i < recurrenceCount; i++) {
                    const nextDate = new Date(originalDate);
                    nextDate.setDate(nextDate.getDate() + i * recurrenceIntervalDays);
                    const nextDateStr = nextDate.toISOString().split('T')[0];

                    await addAppointment(TEMP_USER_ID, {
                        ...appointmentData,
                        date: nextDateStr,
                        seriesId
                    });
                }
            }

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
                            <button onClick={handleParseWithAI} disabled={isParsing} className="w-full mt-4 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-500">
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

export default function NewAppointmentPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <NewAppointmentPageInternal />
        </Suspense>
    );
}