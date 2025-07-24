// src/app/dashboard/settings/page.tsx
import { getTemplatesData, getProfileData } from '@/utils/firestoreService';
import SettingsPageContent from '@/components/SettingsPageContent';
import type { Template, UserProfile } from '@/types/app-interfaces';
import { Timestamp } from 'firebase/firestore';

const TEMP_USER_ID = "dev-user-1";

// ✅ FIX: Added a generic type to handle any kind of document
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
    const [templatesData, profileData] = await Promise.all([
        getTemplatesData(TEMP_USER_ID),
        getProfileData(TEMP_USER_ID)
    ]);

    const templates = templatesData.map(t => serializeData(t));
    const profile = serializeData(profileData);

    return (
        <SettingsPageContent
            initialTemplates={templates as Template[]}
            initialProfile={profile as UserProfile | null}
            userId={TEMP_USER_ID}
        />
    );
}