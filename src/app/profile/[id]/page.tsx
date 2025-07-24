// src/app/profile/[id]/page.tsx
import { getPublicUserProfile, getPublicCertifications } from '@/utils/firestoreService';
import ProfilePageContent from '@/components/ProfilePageContent';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

interface ProfilePageProps {
  params: {
    id: string;
  };
}

// Helper function to convert Firestore Timestamps to strings
const serializeData = (doc: any) => {
    if (!doc) return null;
    const data = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data;
};


export default async function ProfilePage({ params }: { params: { id: string } }) {
    const userId = params.id;
    
    const [profileData, certificationsData] = await Promise.all([
        getPublicUserProfile(userId),
        getPublicCertifications(userId)
    ]);

    if (!profileData) {
        notFound();
    }
    
    // ✅ FIX: Serialize the data before passing it to the client component
    const profile = serializeData(profileData);
    const certifications = certificationsData.map(serializeData);

    return (
        <ProfilePageContent 
            profile={profile} 
            certifications={certifications} 
        />
    );
}