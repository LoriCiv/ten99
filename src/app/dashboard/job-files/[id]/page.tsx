// src/app/dashboard/job-files/[id]/page.tsx
import { getJobFile, getClients, getPersonalNetwork, getAppointments } from '@/utils/firestoreService';
import JobFileDetailPageContent from '@/components/JobFileDetailPageContent';
import { notFound } from 'next/navigation';

const TEMP_USER_ID = "dev-user-1";

// ✅ THE FIX: Added a specific type for the page's props
interface PageProps {
    params: { id: string };
}

export default async function JobFileDetailPage({ params }: PageProps) {
    const jobFileId = params.id;

    // A helper function to fetch data without a real-time listener for server components
    const getServerSideProps = async () => {
        const jobFilePromise = new Promise<any>((resolve) => getJobFile(TEMP_USER_ID, jobFileId, resolve));
        const clientsPromise = new Promise<any>((resolve) => getClients(TEMP_USER_ID, resolve));
        const contactsPromise = new Promise<any>((resolve) => getPersonalNetwork(TEMP_USER_ID, resolve));
        const appointmentsPromise = new Promise<any>((resolve) => getAppointments(TEMP_USER_ID, resolve));
        
        const [jobFile, clients, contacts, appointments] = await Promise.all([
            jobFilePromise,
            clientsPromise,
            contactsPromise,
            appointmentsPromise,
        ]);
        
        return { jobFile, clients, contacts, appointments };
    };
    
    const { jobFile, clients, contacts, appointments } = await getServerSideProps();

    if (!jobFile) {
        notFound();
    }

    return (
        <JobFileDetailPageContent
            initialJobFile={jobFile}
            initialClients={clients}
            initialContacts={contacts}
            initialAppointments={appointments}
        />
    );
}