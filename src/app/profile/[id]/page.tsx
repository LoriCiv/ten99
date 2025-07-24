import { getPublicUserProfile, getPublicCertifications } from '@/utils/firestoreService';
import { notFound } from 'next/navigation';
import PublicProfileContent from '@/components/PublicProfileContent';
import { Timestamp } from 'firebase/firestore';
import type { Certification, UserProfile } from '@/types/app-interfaces';

interface PageProps {
    params: { id: string };
}

// ✅ FIX: Improved the typing inside this helper function
const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    const data = { ...doc } as { [key: string]: any };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = (data[key] as Timestamp).toDate().toISOString();
        }
    }
    return data as T;
};

export default async function ProfilePage({ params }: PageProps) {
    const userId = params.id;

    const [profileData, certificationsData] = await Promise.all([
        getPublicUserProfile(userId),
        getPublicCertifications(userId)
    ]);

    if (!profileData) {
        notFound();
    }

    const profile = serializeData(profileData);
    const certifications = certificationsData.map(cert => serializeData(cert));

    return (
        <PublicProfileContent
            profile={profile as UserProfile | null}
            certifications={certifications as Certification[]}
        />
    );
}