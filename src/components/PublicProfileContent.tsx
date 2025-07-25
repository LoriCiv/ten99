"use client";

import type { UserProfile, Certification } from '@/types/app-interfaces';
import Image from 'next/image';
import { User, Award, BookOpen, Briefcase, GraduationCap, Languages, ExternalLink } from 'lucide-react';

interface PublicProfileContentProps {
    profile: UserProfile | null;
    certifications: (Certification | null)[];
}

const SectionCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold text-lg flex items-center gap-3">
                <Icon size={20} className="text-primary" />
                {title}
            </h3>
        </div>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

export default function PublicProfileContent({ profile, certifications }: PublicProfileContentProps) {
    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Profile not found.</div>;
    }

    return (
        <div className="bg-background min-h-screen">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-card border rounded-lg">
                    <div className="relative w-32 h-32 rounded-full bg-muted flex items-center justify-center border shrink-0 overflow-hidden">
                        {profile.photoUrl ? (
                            // ✅ FIX: Replaced 'fill' and 'style' with 'width', 'height', and 'className'
                            <Image 
                                src={profile.photoUrl} 
                                alt="Profile" 
                                width={128} 
                                height={128} 
                                className="object-cover" 
                            />
                        ) : (
                            <User className="w-16 h-16 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">{profile.name}</h1>
                        <p className="text-xl text-primary">{profile.professionalTitle}</p>
                        <p className="text-muted-foreground mt-2">{profile.bio}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {certifications && certifications.length > 0 && (
                         <SectionCard title="Credentials" icon={Award}>
                            {certifications.map(cert => cert && (
                                <div key={cert.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{cert.name}</p>
                                        <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                                    </div>
                                    {cert.credentialUrl && (
                                        <a
                                            href={cert.credentialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-semibold bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            <span>View</span>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </SectionCard>
                    )}
                    {profile.skills && profile.skills.length > 0 && (
                        <SectionCard title="Skills & Specialties" icon={BookOpen}>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <span key={skill} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{skill}</span>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                        <SectionCard title="Languages" icon={Languages}>
                            <div className="flex flex-wrap gap-2">
                                {profile.languages.map(lang => (
                                    <span key={lang} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{lang}</span>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                    {profile.jobHistory && profile.jobHistory.length > 0 && (
                        <SectionCard title="Job History" icon={Briefcase}>
                            {profile.jobHistory.map((job, index) => (
                                <div key={index} className={index !== 0 ? "pt-4 border-t" : ""}>
                                    <p className="font-semibold">{job.title} at {job.company}</p>
                                    <p className="text-sm text-muted-foreground">{job.years}</p>
                                </div>
                            ))}
                        </SectionCard>
                    )}
                    {profile.education && profile.education.length > 0 && (
                        <SectionCard title="Education" icon={GraduationCap}>
                            {profile.education.map((edu, index) => (
                                 <div key={index} className={index !== 0 ? "pt-4 border-t" : ""}>
                                    <p className="font-semibold">{edu.degree}</p>
                                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                </div>
                            ))}
                        </SectionCard>
                    )}
                </div>
            </div>
        </div>
    );
}