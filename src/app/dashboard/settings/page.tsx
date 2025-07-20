// src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Template, UserProfile } from '@/types/app-interfaces';
import { getTemplates, getUserProfile } from '@/utils/firestoreService';
import SettingsPageContent from '@/components/SettingsPageContent';

const TEMP_USER_ID = "dev-user-1";

export default function SettingsPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubTemplates = getTemplates(TEMP_USER_ID, (data) => {
            setTemplates(data);
        });

        const unsubProfile = getUserProfile(TEMP_USER_ID, (data) => {
            setUserProfile(data);
            setIsLoading(false); 
        });

        return () => {
            unsubTemplates();
            unsubProfile();
        };
    }, []);

    if (isLoading || !userProfile) {
        return <div className="p-8 text-center text-muted-foreground">Loading Settings...</div>;
    }

    return (
        <SettingsPageContent
            initialTemplates={templates}
            initialProfile={userProfile}
            userId={TEMP_USER_ID}
        />
    );
}