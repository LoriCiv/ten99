"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getAppointments, getClients, getPersonalNetwork, getJobFiles } from '@/utils/firestoreService';
import { format } from 'date-fns';
import { PlusCircle, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import AppointmentDetailModal from '@/components/AppointmentDetailModal';
import InteractiveCalendar from '@/components/InteractiveCalendar';

const TEMP_USER_ID = "dev-user-1";

const getEventStyle = (eventType?: 'job' | 'personal' | 'billing') => {
    switch (eventType) {
        case 'job': return { borderColor: 'border-l-green-500', bgColor: 'hover:bg-green-500/10' };
        case 'personal': return { borderColor: 'border-l-blue-500', bgColor: 'hover:bg-blue-500/10' };
        case 'billing': return { borderColor: 'border-l-yellow-500', bgColor: 'hover:bg-yellow-500/10' };
        default: return { borderColor: 'border-l-gray-500', bgColor: 'hover:bg-gray-500/10' };
    }
};

export default function AppointmentsPage() {
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // ✅ Changed default state to false
    const [isKeyOpen, setIsKeyOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const unsubAppointments = getAppointments(TEMP_USER_ID, setAllAppointments);
        const unsubClients = getClients(TEMP_USER_ID, setClients);
        const unsubContacts = getPersonalNetwork(TEMP_USER_ID, setContacts);
        const unsubJobFiles = getJobFiles(TEMP_USER_ID, setJobFiles);
        
        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            unsubAppointments();
            unsubClients();
            unsubContacts();
            unsubJobFiles();
            clearTimeout(timer);
        };
    }, []);

    const filteredAppointments = useMemo(() => {
        if (!searchTerm) {
            return allAppointments;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return allAppointments.filter(appt => {
            const client = clients.find(c => c.id === appt.clientId);
            const clientName = client?.companyName || client?.name || '';

            return (
                appt.subject?.toLowerCase().includes(lowercasedTerm) ||
                appt.notes?.toLowerCase().includes(lowercasedTerm) ||
                appt.address?.toLowerCase().includes(lowercasedTerm) ||
                appt.virtualLink?.toLowerCase().includes(lowercasedTerm) ||
                clientName.toLowerCase().includes(lowercasedTerm)
            );
        });
    }, [allAppointments, searchTerm, clients]);

    const handleAppointmentClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };
    
    const handleDataSaved = () => {
        console.log("Data saved, UI will update automatically via listeners.");
    };

    const appointmentsForSelectedDay = filteredAppointments
        .filter(appt => {
            const apptDate = new Date(appt.date + 'T00:00:00');
            return apptDate.toDateString() === selectedDate.toDateString();
        })
        .sort((a, b) => a.time.localeCompare(b.time));

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Calendar...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
                        <p className="text-muted-foreground mt-1">View and manage your schedule.</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Link href="/dashboard/appointments/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                            <PlusCircle size={20}/>
                            New Event
                        </Link>
                    </div>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search by subject, client, location, notes..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 p-2 border rounded-md bg-background"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <InteractiveCalendar
                            appointments={filteredAppointments}
                            selectedDate={selectedDate}
                            onDateSelect={(day) => setSelectedDate(day || new Date())}
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-card border rounded-lg">
                            <button 
                                className="w-full flex justify-between items-center"
                                onClick={() => setIsKeyOpen(!isKeyOpen)}
                            >
                                <h3 className="font-semibold text-sm text-muted-foreground">Key</h3>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isKeyOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isKeyOpen && (
                                <div className="pt-2 space-y-2 animate-in fade-in-0">
                                    <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-green-400 border"></div> Job / Appointment</div>
                                    <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-blue-400 border"></div> Personal Event</div>
                                    <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-yellow-400 border"></div> Billing Reminder</div>
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-semibold border-b pb-2">
                            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
                        </h2>
                        <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                            {appointmentsForSelectedDay.length > 0 ? (
                                appointmentsForSelectedDay.map(appt => {
                                    const { borderColor, bgColor } = getEventStyle(appt.eventType);
                                    return (
                                        <div
                                            key={appt.id}
                                            onClick={() => handleAppointmentClick(appt)}
                                            className={`p-4 rounded-lg bg-card border border-l-4 ${borderColor} ${bgColor} cursor-pointer transition-all`}
                                        >
                                            <p className="font-bold text-foreground">{appt.subject}</p>
                                            <p className="text-sm text-muted-foreground">{appt.time}</p>
                                            {(appt.eventType === 'job' || !appt.eventType) && (
                                                <p className="text-sm text-primary/80 mt-1">
                                                    {clients.find(c => c.id === appt.clientId)?.companyName || clients.find(c => c.id === appt.clientId)?.name || 'No Client'}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-muted-foreground pt-10"><p>No events for this day.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    clients={clients}
                    contacts={contacts}
                    jobFiles={jobFiles}
                    onClose={handleCloseModal}
                    onSave={handleDataSaved}
                />
            )}
        </>
    );
}