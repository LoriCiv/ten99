"use client";

import type { UserProfile, Certification, JobHistoryEntry, EducationEntry } from '@/types/app-interfaces';
import Image from 'next/image';
// ✅ 1. Import the GraduationCap icon
import { User, MapPin, Briefcase, Award, Languages, Sparkles, History, ExternalLink, GraduationCap } from 'lucide-react';

interface ProfilePageContentProps {
    profile: UserProfile;
    certifications: Certification[];
}

const ProfileTag = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1 rounded-full">
        {children}
    </span>
);

export default function ProfilePageContent({ profile, certifications }: ProfilePageContentProps) {
    return (
        <div className="bg-background min-h-screen">
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-card p-8 rounded-2xl border shadow-sm">
                    {/* --- HEADER SECTION --- */}
                    <header className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                        <div className="relative w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 shrink-0 overflow-hidden">
                            {profile.photoUrl ? (
                                <Image src={profile.photoUrl} alt="Profile Photo" layout="fill" className="object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-muted-foreground" />
                            )}
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-4xl font-bold text-foreground">{profile.name || 'Freelancer'}</h1>
                            <h2 className="text-xl font-medium text-primary mt-1">{profile.professionalTitle || 'No Title Provided'}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-muted-foreground text-sm">
                                {profile.zipCode && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.zipCode}</span>}
                                {profile.isVirtual && <span className="flex items-center gap-1.5"><Briefcase size={14} /> Available for virtual work</span>}
                            </div>
                        </div>
                    </header>

                    {/* --- BIO SECTION --- */}
                    {profile.bio && (
                        <Section title="About Me">
                            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                        </Section>
                    )}

                    {/* --- SKILLS & LANGUAGES --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {profile.skills && profile.skills.length > 0 && (
                            <Section title="Skills & Specialties" icon={Sparkles}>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map(skill => <ProfileTag key={skill}>{skill}</ProfileTag>)}
                                </div>
                            </Section>
                        )}
                        {profile.languages && profile.languages.length > 0 && (
                            <Section title="Languages" icon={Languages}>
                                <div className="flex flex-wrap gap-2">
                                    {profile.languages.map(lang => <ProfileTag key={lang}>{lang}</ProfileTag>)}
                                </div>
                            </Section>
                        )}
                    </div>
                    
                    {/* --- CREDENTIALS SECTION --- */}
                    {certifications && certifications.length > 0 && (
                        <Section title="Credentials" icon={Award}>
                            <div className="space-y-4">
                                {certifications.map(cert => (
                                    <div key={cert.id} className="p-4 border rounded-lg bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div>
                                            <h4 className="font-bold text-foreground">{cert.name}</h4>
                                            <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Issued: {cert.issueDate} {cert.expirationDate && `| Expires: ${cert.expirationDate}`}
                                            </p>
                                        </div>
                                        {cert.credentialUrl && (
                                            <a 
                                                href={cert.credentialUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-center"
                                                title="View Credential"
                                            >
                                                <ExternalLink size={16} />
                                                <span>View</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* --- JOB HISTORY & EDUCATION --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {profile.jobHistory && profile.jobHistory.length > 0 && (
                             <Section title="Job History" icon={History}>
                                <div className="space-y-4">
                                    {profile.jobHistory.map((job: JobHistoryEntry, index: number) => (
                                        <div key={index} className="p-4 border rounded-lg bg-background/50">
                                            <h4 className="font-bold text-foreground">{job.title}</h4>
                                            <p className="text-sm text-muted-foreground">{job.company}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{job.years}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                        
                        {/* ✅ 2. ADDED EDUCATION SECTION */}
                        {profile.education && profile.education.length > 0 && (
                            <Section title="Education" icon={GraduationCap}>
                                <div className="space-y-4">
                                    {profile.education.map((edu: EducationEntry, index: number) => (
                                        <div key={index} className="p-4 border rounded-lg bg-background/50">
                                            <h4 className="font-bold text-foreground">{edu.degree}</h4>
                                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper component for consistent section styling
const Section = ({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode; }) => (
    <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            {Icon && <Icon className="text-primary" size={20} />}
            {title}
        </h3>
        {children}
    </section>
);