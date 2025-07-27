import { getPublicUserProfile } from '@/utils/firestoreService';
import { notFound } from 'next/navigation';
import PublicProfileContent from '@/components/PublicProfileContent';
import { Timestamp } from 'firebase/firestore';
import type { Certification, UserProfile } from '@/types/app-interfaces';

// Placeholder function to allow the build to pass
const getPublicCertifications = async (userId: string): Promise<Certification[]> => {
    console.error("getPublicCertifications function is not implemented. This is a placeholder.");
    return []; // Return an empty array to prevent errors
}

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

export default async function ProfilePage({ params }: { params: { id: string } }) {
    const userId = params.id;

    const [profileData, certificationsData] = await Promise.all([
        getPublicUserProfile(userId),
        getPublicCertifications(userId) // This now calls the placeholder
    ]);

    if (!profileData) {
        notFound();
    }

    const profile = serializeData(profileData);
    // This will now map over an empty array, which is safe
    const certifications = certificationsData.map(cert => serializeData(cert));

    return (
        <PublicProfileContent
            profile={profile as UserProfile | null}
            certifications={certifications as Certification[]}
        />
    );
}