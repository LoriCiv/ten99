// ✅ 1. Import getRemindersData and the Reminder type
import { getTemplatesData, getProfileData, getRemindersData } from '@/utils/firestoreService';
import SettingsPageContent from '@/components/SettingsPageContent';
import type { Template, UserProfile, Reminder } from '@/types/app-interfaces';
import { Timestamp } from 'firebase/firestore';
import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';

// Helper function to serialize Firestore Timestamps for the client
const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // ✅ 2. Fetch reminders data along with the other data
    const [templatesData, profileData, remindersData] = await Promise.all([
        getTemplatesData(userId),
        getProfileData(userId),
        getRemindersData(userId)
    ]);

    const templates = templatesData.map(t => serializeData(t));
    const profile = serializeData(profileData);
    const reminders = remindersData.map(r => serializeData(r)); // ✅ 3. Serialize the reminders

    return (
        <SettingsPageContent
            initialTemplates={templates as Template[]}
            initialProfile={profile as UserProfile | null}
            initialReminders={reminders as Reminder[]} // ✅ 4. Pass the reminders as a prop
            userId={userId}
        />
    );
}