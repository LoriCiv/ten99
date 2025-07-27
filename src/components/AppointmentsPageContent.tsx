// src/components/AppointmentsPageContent.tsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, PlusCircle, ChevronDown, MapPin, Video, CheckCircle, Clock, AlertTriangle, XCircle, Calendar, HelpCircle, List, BookOpen } from 'lucide-react';
import type { Appointment, Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getAppointments, getClients, getPersonalNetwork, getJobFiles } from '@/utils/firestoreService';
import { format } from 'date-fns';
import Link from 'next/link';
import AppointmentDetailModal from '@/components/AppointmentDetailModal';
import InteractiveCalendar from '@/components/InteractiveCalendar';
import { useFirebase } from './FirebaseProvider'; // Import the hook

const statusInfo: { [key: string]: { icon: React.ElementType, keyColor: string, label: string } } = {
    'scheduled': { icon: Calendar, keyColor: 'bg-blue-400', label: 'Scheduled' },
    'pending': { icon: Clock, keyColor: 'bg-yellow-400', label: 'Pending' },
    'completed': { icon: CheckCircle, keyColor: 'bg-green-400', label: 'Completed' },
    'canceled': { icon: XCircle, keyColor: 'bg-gray-400', label: 'Canceled' },
    'canceled-billable': { icon: AlertTriangle, keyColor: 'bg-red-400', label: 'Canceled (Billable)' },
    'pending-confirmation': { icon: HelpCircle, keyColor: 'bg-orange-400', label: 'Pending Confirmation' }
};
const eventTypeInfo: { [key: string]: { borderColor: string, bgColor: string, icon: React.ElementType, keyColor: string, label: string } } = {
    'job': { borderColor: 'border-l-blue-500', bgColor: 'hover:bg-blue-500/10', icon: Calendar, keyColor: 'bg-blue-400', label: 'Job' },
    'personal': { borderColor: 'border-l-pink-500', bgColor: 'hover:bg-pink-500/10', icon: Calendar, keyColor: 'bg-pink-400', label: 'Personal' },
    'billing': { borderColor: 'border-l-green-500', bgColor: 'hover:bg-green-500/10', icon: Calendar, keyColor: 'bg-green-400', label: 'Billing' },
    'education': { borderColor: 'border-l-purple-500', bgColor: 'hover:bg-purple-500/10', icon: BookOpen, keyColor: 'bg-purple-400', label: 'Education' }
};
const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};
const AppointmentListItem = ({ appointment, clientName }: { appointment: Appointment, clientName: string }) => {
    const statusStyle = statusInfo[appointment.status] || { keyColor: 'bg-gray-400' };
    const typeStyle = eventTypeInfo[appointment.eventType] || { keyColor: 'bg-gray-400' };
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4">
            <div className="md:col-span-1"><p className="font-semibold">{format(new Date(appointment.date + 'T00:00:00'), 'MMM d, yyyy')}</p><p className="text-xs text-muted-foreground">{formatTime(appointment.time)}</p></div>
            <div className="md:col-span-2"><p className="font-semibold text-foreground">{appointment.subject}</p><p className="text-xs text-primary">{clientName}</p></div>
            <div className="md:col-span-1"><span className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"><span className={`w-2 h-2 rounded-full ${statusStyle.keyColor}`}></span>{statusInfo[appointment.status]?.label || 'Unknown'}</span></div>
            <div className="md:col-span-2 text-right"><span className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"><span className={`w-2 h-2 rounded-full ${typeStyle.keyColor}`}></span>{eventTypeInfo[appointment.eventType]?.label || 'Event'}</span></div>
        </div>
    );
};

interface AppointmentsPageContentProps {
    userId: string;
}

export default function AppointmentsPageContent({ userId }: AppointmentsPageContentProps) {
    const { isFirebaseAuthenticated } = useFirebase();
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKeyOpen, setIsKeyOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    useEffect(() => {
        if (isFirebaseAuthenticated) {
            const unsubAppointments = getAppointments(userId, (data) => {
                setAllAppointments(data);
                setIsLoading(false);
            });
            const unsubClients = getClients(userId, setClients);
            const unsubContacts = getPersonalNetwork(userId, setContacts);
            const unsubJobFiles = getJobFiles(userId, setJobFiles);
            return () => {
                unsubAppointments();
                unsubClients();
                unsubContacts();
                unsubJobFiles();
            };
        }
    }, [userId, isFirebaseAuthenticated]);

    const filteredAppointments = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) return allAppointments;
        return allAppointments.filter(appt => {
            const client = clients.find(c => c.id === appt.clientId);
            const clientName = client?.companyName || client?.name || '';
            return (appt.subject?.toLowerCase().includes(lowercasedTerm) || appt.notes?.toLowerCase().includes(lowercasedTerm) || appt.address?.toLowerCase().includes(lowercasedTerm) || clientName.toLowerCase().includes(lowercasedTerm));
        });
    }, [allAppointments, searchTerm, clients]);
    
    const sortedAppointments = useMemo(() => [...filteredAppointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [filteredAppointments]);
    const handleAppointmentClick = (appointment: Appointment) => { setSelectedAppointment(appointment); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedAppointment(null); };
    const handleDataSaved = () => console.log("Data saved, UI will update automatically via listeners.");
    const appointmentsForSelectedDay = useMemo(() => filteredAppointments.filter(appt => new Date(appt.date + 'T00:00:00').toDateString() === selectedDate.toDateString()).sort((a, b) => a.time.localeCompare(b.time)), [filteredAppointments, selectedDate]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading Calendar...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
                        <p className="text-muted-foreground mt-1">View and manage your schedule.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1 bg-muted rounded-lg">
                            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                                <Calendar size={16} /> Calendar
                            </button>
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                                <List size={16} /> List
                            </button>
                        </div>
                        <Link href="/dashboard/appointments/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                            <PlusCircle size={20}/> New Event
                        </Link>
                    </div>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input type="text" placeholder="Search by subject, client, location, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 p-2 border rounded-md bg-background"/>
                    </div>
                </div>
                
                {viewMode === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <InteractiveCalendar appointments={filteredAppointments} selectedDate={selectedDate} onDateSelect={(day) => setSelectedDate(day || new Date())} currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-card border rounded-lg">
                                <button className="w-full flex justify-between items-center" onClick={() => setIsKeyOpen(!isKeyOpen)}>
                                    <h3 className="font-semibold text-sm text-muted-foreground">Key</h3>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isKeyOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isKeyOpen && (
                                    <div className="pt-2 mt-2 border-t space-y-2 animate-in fade-in-0">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Event Type</p>
                                        {Object.values(eventTypeInfo).map((type) => (<div key={type.label} className="flex items-center gap-2 text-sm"><div className={`w-3 h-3 rounded-full ${type.keyColor} border`}></div> {type.label}</div>))}
                                        <p className="text-xs font-semibold text-muted-foreground uppercase pt-2">Status</p>
                                        {Object.values(statusInfo).map((status) => (<div key={status.label} className="flex items-center gap-2 text-sm"><div className={`w-3 h-3 rounded-full ${status.keyColor} border`}></div> {status.label}</div>))}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold border-b pb-2">Schedule for {format(selectedDate, 'MMMM d, yyyy')}</h2>
                            <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                                {appointmentsForSelectedDay.length > 0 ? (
                                    appointmentsForSelectedDay.map(appt => {
                                        const { borderColor, bgColor, icon: TypeIcon } = eventTypeInfo[appt.eventType] || { borderColor: 'border-l-gray-500', bgColor: 'hover:bg-gray-500/10', icon: Calendar };
                                        const { icon: StatusIcon } = statusInfo[appt.status] || { icon: HelpCircle };
                                        const clientName = clients.find(c => c.id === appt.clientId)?.companyName || clients.find(c => c.id === appt.clientId)?.name;
                                        return (
                                            <div key={appt.id} onClick={() => handleAppointmentClick(appt)} className={`p-4 rounded-lg bg-card border border-l-4 ${borderColor} ${bgColor} cursor-pointer transition-all space-y-1`}>
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-foreground flex items-center gap-2"><TypeIcon size={14} /> {appt.subject}</p>
                                                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">{formatTime(appt.time)}{appt.endTime && ` - ${formatTime(appt.endTime)}`}</p>
                                                <div className="flex flex-col gap-1 pt-1">{clientName && (<p className="text-sm text-primary/80 font-medium">{clientName}</p>)}{appt.locationType === 'virtual' && (<div className="flex items-center gap-2 text-xs text-muted-foreground"><Video size={14} /><span>Virtual</span></div>)}{appt.locationType === 'physical' && appt.address && (<div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={14} /><span>{appt.address}</span></div>)}</div>
                                            </div>
                                        );
                                    })
                                ) : ( <div className="text-center text-muted-foreground pt-10"><p>No events for this day.</p></div> )}
                            </div>
                        </div>
                    </div>
                )}
                
                {viewMode === 'list' && (
                    <div className="bg-card rounded-lg border">
                        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-6 gap-4 text-xs font-semibold text-muted-foreground uppercase">
                            <span className="md:col-span-1">Date & Time</span>
                            <span className="md:col-span-2">Subject & Client</span>
                            <span className="md:col-span-1">Status</span>
                            <span className="md:col-span-2 text-right">Type</span>
                        </div>
                        <div className="divide-y divide-border">
                            {sortedAppointments.map(appt => (
                                <div key={appt.id} onClick={() => handleAppointmentClick(appt)} className="cursor-pointer hover:bg-muted">
                                    <AppointmentListItem
                                        appointment={appt}
                                        clientName={clients.find(c => c.id === appt.clientId)?.name || ''}
                                    />
                                </div>
                            ))}
                        </div>
                        {sortedAppointments.length === 0 && (
                            <p className="p-8 text-center text-muted-foreground">You have no appointments scheduled.</p>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && selectedAppointment && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    clients={clients}
                    contacts={contacts}
                    jobFiles={jobFiles}
                    onClose={handleCloseModal}
                    onSave={handleDataSaved}
                    userId={userId}
                />
            )}
        </>
    );
}