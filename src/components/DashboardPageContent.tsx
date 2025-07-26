"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAppointments, getMessagesForUser, getJobPostings, getPriorityJobFiles, getUserProfile, getClients, addExpense, getReminders } from '@/utils/firestoreService';
import type { Appointment, JobFile, UserProfile, Message, JobPosting, Client, Expense, Reminder } from '@/types/app-interfaces';
import Link from 'next/link';
import { Calendar, FileText, DollarSign, ArrowRight, Inbox, AlertCircle, X, Bell, PlusCircle, BellRing } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import Modal from '@/components/Modal';
import ExpenseForm from '@/components/ExpenseForm';
import clsx from 'clsx';

const statusColors: { [key: string]: string } = {
    'scheduled': 'border-blue-500',
    'pending': 'border-yellow-500',
    'completed': 'border-green-500',
    'canceled': 'border-gray-400',
    'canceled-billable': 'border-red-500',
    'pending-confirmation': 'border-orange-500'
};

const ActionCard = ({ title, children, icon: Icon, link }: { title: string, children: React.ReactNode, icon: React.ElementType, link?: string }) => (
    <div className="bg-card p-6 rounded-lg border flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Icon className="text-primary" size={20} />
                {title}
            </h3>
            {link && (
               <Link href={link} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                   View All <ArrowRight size={14} />
               </Link>
            )}
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const AgendaItem = ({ appointment, jobFile }: { appointment: Appointment, jobFile: JobFile | undefined }) => {
    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const jobFileLink = jobFile 
        ? `/dashboard/job-files/${jobFile.id}`
        : `/dashboard/job-files/new?appointmentId=${appointment.id}&clientId=${appointment.clientId || ''}&subject=${encodeURIComponent(appointment.subject || '')}`;

    return (
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <div>
                <p className="font-semibold text-foreground">{appointment.subject}</p>
                <p className="text-sm text-muted-foreground">{formatTime(appointment.time)}</p>
            </div>
            <Link href={jobFileLink} className="text-xs font-semibold bg-secondary text-secondary-foreground py-1 px-2 rounded-md hover:bg-secondary/80">
                {jobFile ? 'View File' : 'Create File'}
            </Link>
        </div>
    );
};

// ✅ 1. Update the props to receive a userId
interface DashboardPageContentProps {
  userId: string;
}

export default function DashboardPageContent({ userId }: DashboardPageContentProps) { // ✅ 2. Receive userId as a prop
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [priorityJobFiles, setPriorityJobFiles] = useState<JobFile[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showJobAlert, setShowJobAlert] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

    useEffect(() => {
        // ✅ 3. Use the real userId for all data fetching
        const unsubProfile = getUserProfile(userId, setUserProfile);
        const unsubAppointments = getAppointments(userId, setAppointments);
        const unsubJobFiles = getPriorityJobFiles(userId, setPriorityJobFiles);
        const unsubMessages = getMessagesForUser(userId, setMessages);
        const unsubJobPostings = getJobPostings(setJobPostings);
        const unsubClients = getClients(userId, setClients);
        const unsubReminders = getReminders(userId, setReminders);
        
        setTimeout(() => setIsLoading(false), 1000);

        return () => {
            unsubProfile();
            unsubAppointments();
            unsubJobFiles();
            unsubMessages();
            unsubJobPostings();
            unsubClients();
            unsubReminders();
        };
    }, [userId]); // ✅ 4. Add userId to the dependency array

    const upcomingAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        return appointments
            .filter(appt => appt.status === 'scheduled' && new Date(appt.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [appointments]);

    const weekView = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return days.map(day => {
            const dailyAppointments = appointments
                .filter(appt => isSameDay(new Date(appt.date + 'T00:00:00'), day))
                .sort((a, b) => a.time.localeCompare(b.time));
            return {
                date: day,
                isToday: isToday(day),
                appointments: dailyAppointments,
            };
        });
    }, [appointments]);

    const todaysAppointments = useMemo(() => {
        return weekView.find(day => day.isToday)?.appointments || [];
    }, [weekView]);

    const todaysReminders = useMemo(() => {
        const today = new Date();
        const todayFormatted = format(today, 'yyyy-MM-dd');
        const dayOfWeek = format(today, 'eeee');
        const dateOfMonth = today.getDate();

        return reminders.filter(reminder => {
            if (reminder.type === 'one-time') {
                return reminder.reminderDate === todayFormatted;
            }
            if (reminder.type === 'recurring') {
                if (reminder.frequency === 'weekly') {
                    return reminder.dayOfWeek === dayOfWeek;
                }
                if (reminder.frequency === 'monthly') {
                    return reminder.dateOfMonth === dateOfMonth;
                }
            }
            return false;
        });
    }, [reminders]);

    const inboxStats = useMemo(() => {
        const unreadCount = messages.filter(m => !m.isRead).length;
        const pendingRequests = messages.filter(m => m.type === 'inbound-offer' && m.status === 'new');
        return { unreadCount, pendingRequests };
    }, [messages]);

    const matchingJobs = useMemo(() => {
        if (!userProfile?.skills || userProfile.skills.length === 0) {
            return [];
        }
        return jobPostings.filter(post => 
            post.requiredSkills?.some(requiredSkill => userProfile.skills?.includes(requiredSkill))
        );
    }, [jobPostings, userProfile]);

    const nextAppointment = upcomingAppointments[0];

    const handleAddExpense = async (data: Partial<Expense>) => {
        setIsSubmittingExpense(true);
        try {
            // ✅ 5. Use the real userId to add an expense
            await addExpense(userId, data);
            alert("Expense added successfully!");
            setIsExpenseModalOpen(false);
        } catch (error) {
            console.error("Failed to add expense:", error);
            alert("Failed to add expense.");
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading your dashboard...</div>;
    }

    return (
        <>
            <div className="space-y-8">
                {showJobAlert && matchingJobs.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 text-primary-foreground p-4 rounded-lg flex items-center justify-between animate-in fade-in-0">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <span className="text-sm font-semibold text-primary">
                                There {matchingJobs.length === 1 ? 'is 1 new job' : `are ${matchingJobs.length} new jobs`} matching your skills!
                            </span>
                            <Link href="/dashboard/job-board" className="text-sm font-bold text-primary underline hover:opacity-80">
                                View Now
                            </Link>
                        </div>
                        <button onClick={() => setShowJobAlert(false)} className="p-1 text-primary rounded-full hover:bg-primary/20">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <header>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {userProfile?.name || 'friend'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your freelance world today.</p>
                </header>
                
                {nextAppointment && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center gap-3">
                        <Bell className="h-5 w-5" />
                        <span className="text-sm font-semibold">
                            Next Up: {nextAppointment.subject} on {format(new Date(nextAppointment.date + 'T00:00:00'), 'eeee')} at {nextAppointment.time}
                        </span>
                    </div>
                )}

                {todaysReminders.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-lg space-y-2">
                        {todaysReminders.map(reminder => (
                            <div key={reminder.id} className="flex items-center gap-3">
                                <BellRing className="h-5 w-5" />
                                <span className="text-sm font-semibold">{reminder.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Today&apos;s Agenda ({format(new Date(), 'eeee, MMM d')})</h3>
                        <Link href="/dashboard/appointments" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                            View Calendar <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {todaysAppointments.length > 0 ? (
                            todaysAppointments.map(appt => (
                                <AgendaItem 
                                    key={appt.id} 
                                    appointment={appt} 
                                    jobFile={priorityJobFiles.find(jf => jf.appointmentId === appt.id)} 
                                />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled for today.</p>
                        )}
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">This Week&apos;s Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        {weekView.map(day => (
                            <div key={day.date.toString()} className={`rounded-lg p-3 ${day.isToday ? 'bg-secondary' : 'bg-background'}`}>
                                <p className={`font-bold text-center text-sm ${day.isToday ? 'text-primary' : 'text-foreground'}`}>{format(day.date, 'eee')}</p>
                                <p className={`text-center text-xs mb-2 ${day.isToday ? 'text-primary/80' : 'text-muted-foreground'}`}>{format(day.date, 'd')}</p>
                                <div className="space-y-1">
                                    {day.appointments.length > 0 ? day.appointments.map(appt => (
                                        <div key={appt.id} className={clsx(
                                            "text-xs bg-card p-1.5 rounded border-l-2",
                                            statusColors[appt.status] || 'border-gray-400'
                                        )}>
                                            <p className="font-semibold truncate">{appt.subject}</p>
                                        </div>
                                    )) : (
                                        <div className="h-8"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ActionCard title="Inbox Summary" icon={Inbox} link="/dashboard/mailbox">
                           <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Unread Messages:</span>
                                    <span className="font-bold text-foreground">{inboxStats.unreadCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Pending Requests:</span>
                                    <span className="font-bold text-foreground">{inboxStats.pendingRequests.length}</span>
                                </div>
                           </div>
                           <Link href="/dashboard/mailbox" className="w-full mt-4 inline-flex items-center justify-center bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80 text-sm">
                                Go to Inbox
                           </Link>
                    </ActionCard>

                    <ActionCard title="Quick Actions" icon={PlusCircle}>
                           <p className="text-sm text-muted-foreground mb-4">Quickly add common items.</p>
                           <button onClick={() => setIsExpenseModalOpen(true)} className="w-full bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80 text-sm">
                                Add New Expense
                           </button>
                    </ActionCard>

                    <ActionCard title="Starred Job Files" icon={FileText} link="/dashboard/job-files">
                           {priorityJobFiles.length > 0 ? priorityJobFiles.slice(0, 3).map(job => (
                               <div key={job.id} className="text-sm p-2 rounded-md hover:bg-muted">
                                   <p className="font-semibold truncate">{job.jobTitle}</p>
                               </div>
                           )) : <p className="text-sm text-muted-foreground p-2">No 2-star job files.</p>}
                           <Link href="/dashboard/job-files" className="w-full mt-4 inline-flex items-center justify-center bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80 text-sm">
                                View All Job Files
                           </Link>
                    </ActionCard>
                </div>
            </div>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
                <div className="p-6">
                   <ExpenseForm 
                        userId={userId} 
                        onSave={handleAddExpense} 
                        onCancel={() => setIsExpenseModalOpen(false)} 
                        clients={clients}
                        isSubmitting={isSubmittingExpense}
                        userProfile={userProfile}
                        initialData={{}}
                    />
                </div>
            </Modal>
        </>
    );
}