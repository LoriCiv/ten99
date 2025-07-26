import { auth } from '@clerk/nextjs/server';
import { getTemplatesData, getProfileData, getRemindersData } from '@/utils/firestoreService';
import SettingsPageContent from '@/components/SettingsPageContent';
import type { Template, UserProfile, Reminder } from '@/types/app-interfaces';
import { Timestamp } from 'firebase/firestore';
import { redirect } from 'next/navigation';

// Helper function to convert Firestore Timestamps to strings
const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    const data: { [key: string]: any } = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data as T;
};

export default async function SettingsPage() {
    const { userId } = await auth();

    if (!userId) {
      redirect('/sign-in');
    }

    // Fetch all data on the server using the real userId
    const [templatesData, profileData, remindersData] = await Promise.all([
        getTemplatesData(userId),
        getProfileData(userId),
        getRemindersData(userId) // Make sure you have this function in firestoreService
    ]);

    // Serialize the data before passing it to the client component
    const templates = templatesData.map(t => serializeData(t));
    const profile = serializeData(profileData);
    const reminders = remindersData.map(r => serializeData(r));

    return (
        <SettingsPageContent
            initialTemplates={templates as Template[]}
            initialProfile={profile as UserProfile | null}
            initialReminders={reminders as Reminder[]}
            userId={userId}
        />
    );
}