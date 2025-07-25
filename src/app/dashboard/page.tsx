"use client";
import { useState, useEffect, useMemo } from 'react';
import { getAppointments, getRecentInvoices, getUserProfile, getMessagesForUser, getJobPostings, getPriorityJobFiles } from '@/utils/firestoreService';
import type { Appointment, Invoice, JobFile, UserProfile, Message, JobPosting } from '@/types/app-interfaces';
import Link from 'next/link';
// ✅ FIX: Removed unused 'ThumbsUp' and 'Mail' icons
import { Calendar, FileText, DollarSign, ArrowRight, Inbox, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';

const TEMP_USER_ID = "dev-user-1";

const InfoCard = ({ title, link, children, icon: Icon }: { title: string, link: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="bg-card p-6 rounded-lg border flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Icon className="text-primary" size={20} />
                {title}
            </h3>
            <Link href={link} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View All <ArrowRight size={14} />
            </Link>
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const UpcomingAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    return (
        <div className="flex-shrink-0 w-64 bg-background p-4 rounded-lg border space-y-2">
            <p className="font-bold text-foreground truncate">{appointment.subject}</p>
            <p className="text-sm font-semibold text-primary">{format(new Date(appointment.date + 'T00:00:00'), 'eeee, MMM d')}</p>
            <p className="text-sm text-muted-foreground">{appointment.time}</p>
        </div>
    );
};


export default function DashboardPage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [priorityJobFiles, setPriorityJobFiles] = useState<JobFile[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showJobAlert, setShowJobAlert] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            const unsubProfile = getUserProfile(TEMP_USER_ID, setUserProfile);
            const unsubAppointments = getAppointments(TEMP_USER_ID, setAppointments);
            const unsubInvoices = getRecentInvoices(TEMP_USER_ID, setInvoices);
            const unsubJobFiles = getPriorityJobFiles(TEMP_USER_ID, setPriorityJobFiles);
            const unsubMessages = getMessagesForUser(TEMP_USER_ID, setMessages);
            const unsubJobPostings = getJobPostings(setJobPostings);
            
            setTimeout(() => setIsLoading(false), 1000);

            return () => {
                unsubProfile();
                unsubAppointments();
                unsubInvoices();
                unsubJobFiles();
                unsubMessages();
                unsubJobPostings();
            };
        }
        fetchDashboardData();
    }, []);

    const upcomingAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        return appointments
            .filter(appt => appt.status === 'scheduled' && new Date(appt.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [appointments]);

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


    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading your dashboard...</div>;
    }

    return (
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

            <header className="bg-card border rounded-lg p-6">
                 <h1 className="text-3xl font-bold text-foreground">
                    Welcome back, {userProfile?.name || 'friend'}!
                </h1>
                <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your freelance world today.</p>
            </header>
            
            <div className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="text-primary" size={20} />
                        Upcoming Appointments
                    </h3>
                    <Link href="/dashboard/appointments" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        View Calendar <ArrowRight size={14} />
                    </Link>
                </div>
                {upcomingAppointments.length > 0 ? (
                    <div className="flex gap-4 pb-2 -mb-2 -mx-2 px-2 overflow-x-auto">
                        {upcomingAppointments.slice(0, 5).map(appt => (
                            <UpcomingAppointmentCard key={appt.id} appointment={appt} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <InfoCard title="Inbox Summary" link="/dashboard/mailbox" icon={Inbox}>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Unread Messages:</span>
                            <span className="font-bold text-foreground">{inboxStats.unreadCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pending Requests:</span>
                            <span className="font-bold text-foreground">{inboxStats.pendingRequests.length}</span>
                        </div>
                        {inboxStats.pendingRequests.length > 0 && (
                            <div className="pt-2 border-t">
                                {inboxStats.pendingRequests.slice(0, 2).map(req => (
                                    <div key={req.id} className="text-xs p-2 rounded-md hover:bg-muted">
                                        <p className="font-semibold truncate">{req.subject}</p>
                                        <p className="text-muted-foreground">From: {req.senderName}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </InfoCard>

                <InfoCard title="Recent Invoices" link="/dashboard/invoices" icon={DollarSign}>
                     {invoices.length > 0 ? invoices.map(inv => (
                         <div key={inv.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                            <p>#{inv.invoiceNumber}</p>
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-600'}`}>{inv.status}</span>
                            <p className="font-medium">${inv.total.toFixed(2)}</p>
                        </div>
                    )) : <p className="text-sm text-muted-foreground p-2">No recent invoices.</p>}
                </InfoCard>

                <InfoCard title="Starred Job Files" link="/dashboard/job-files" icon={FileText}>
                    {priorityJobFiles.length > 0 ? priorityJobFiles.map(job => (
                        <div key={job.id} className="text-sm p-2 rounded-md hover:bg-muted">
                            <p className="font-semibold">{job.jobTitle}</p>
                        </div>
                    )) : <p className="text-sm text-muted-foreground p-2">No 2-star job files.</p>}
                </InfoCard>
            </div>
        </div>
    );
}
