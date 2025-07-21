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
        fetchData();
    }, [fetchData]);

    const handleParseWithAI = async () => {
        if (!pastedText.trim()) return setAiMessage('Please paste some text to parse.');
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) return setAiMessage("Error: Gemini API key is not configured.");
        setIsParsing(true);
        setAiMessage('AI is parsing the text...');
        setPrefilledData(undefined);
        const clientListForAI = clients.map(c => ({ id: c.id, name: c.companyName || c.name }));
        const prompt = `You are a scheduling assistant... CLIENTS: ${JSON.stringify(clientListForAI)} TEXT: ${pastedText}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const result = await response.json();
            const rawText = result.candidates[0].content.parts[0].text;
            const cleanText = rawText.replace(/```json\n/g, '').replace(/\n```/g, '');
            const jsonStart = cleanText.indexOf('{');
            const jsonEnd = cleanText.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("No valid JSON object found in AI response.");
            const parsedJson = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
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
            setPrefilledData(parsedJson);
            setAiMessage('Success! Form has been pre-filled.');
        } catch (error) {
            console.error("AI Parsing Error:", error);
            setAiMessage("Error parsing AI response. Check console for details.");
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleSaveAppointment = async (appointmentData: Partial<Appointment>, recurrenceEndDate?: string) => {
        setIsSubmitting(true);
        if (!appointmentData.date || !appointmentData.time) {
            alert("Date and Time are required to check for conflicts.");
            setIsSubmitting(false);
            return;
        }

        try {
            // ✅ THE FIX: Restored conflict checking logic
            const newStart = new Date(`${appointmentData.date}T${appointmentData.time}`);
            const newEnd = appointmentData.endTime
                ? new Date(`${appointmentData.date}T${appointmentData.endTime}`)
                : new Date(newStart.getTime() + 60 * 60 * 1000);

            const conflict = allAppointments.find(existing => {
                if (!existing.date || !existing.time || existing.id === appointmentData.id) return false;
                if (existing.date !== appointmentData.date) return false;
                const existStart = new Date(`${existing.date}T${existing.time}`);
                const existEnd = existing.endTime ? new Date(`${existing.date}T${existing.endTime}`) : new Date(existStart.getTime() + 60 * 60 * 1000);
                return newStart < existEnd && newEnd > existStart;
            });

            if (conflict) {
                alert(`⚠️ Conflict: "${conflict.subject}" at ${conflict.time}. Please choose a different time.`);
                setIsSubmitting(false);
                return;
            }
            
            await addAppointment(TEMP_USER_ID, appointmentData, recurrenceEndDate);

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