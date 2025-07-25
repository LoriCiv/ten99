"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Certification, CEU } from '@/types/app-interfaces';
import { PlusCircle, Edit, Trash2, Award, BookOpen, Library, Users } from 'lucide-react';
import { addCertification, updateCertification, deleteCertification, addCEU, updateCEU, deleteCEU } from '@/utils/firestoreService';
import CertificationForm from './CertificationForm';
import CEUForm from './CEUForm';
import CEUDetailModal from './CEUDetailModal';

const getIconForType = (type: 'certification' | 'license' | 'membership') => {
    switch (type) {
        case 'license': return <Library size={18} />;
        case 'membership': return <Users size={18} />;
        case 'certification': default: return <Award size={18} />;
    }
};

interface CertificationsPageContentProps {
    initialCertifications: Certification[];
    initialCeus: CEU[];
    userId: string;
}

export default function CertificationsPageContent({ initialCertifications, initialCeus, userId }: CertificationsPageContentProps) {
    const router = useRouter();
    const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
    const [ceus, setCeus] = useState<CEU[]>(initialCeus);
    const [activeTab, setActiveTab] = useState<'certs' | 'ceus'>('certs');
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [editingCert, setEditingCert] = useState<Partial<Certification> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCeuModalOpen, setIsCeuModalOpen] = useState(false);
    const [selectedCertForCeu, setSelectedCertForCeu] = useState<string | null>(null);
    const [editingCeu, setEditingCeu] = useState<Partial<CEU> | null>(null);
    const [ceuFilter, setCeuFilter] = useState<string>('all');
    const [isCeuDetailModalOpen, setIsCeuDetailModalOpen] = useState(false);
    const [selectedCeuForDetail, setSelectedCeuForDetail] = useState<CEU | null>(null);

    useEffect(() => { setCertifications(initialCertifications); }, [initialCertifications]);
    useEffect(() => { setCeus(initialCeus); }, [initialCeus]);

    const certificationsWithCeus = useMemo(() => {
        return certifications.map(cert => {
            const relevantCeus = ceus.filter(c => c.certificationId === cert.id);
            const totalHoursCompleted = relevantCeus.reduce((sum, ceu) => sum + (ceu.ceuHours || 0), 0);
            const progress = cert.totalCeusRequired && cert.totalCeusRequired > 0 ? Math.min((totalHoursCompleted / cert.totalCeusRequired) * 100, 100) : 0;
            const type = cert.type || 'certification';
            const specialty1Completed = cert.specialtyCeusCategory ? relevantCeus.filter(c => c.category === cert.specialtyCeusCategory).reduce((sum, ceu) => sum + (ceu.ceuHours || 0), 0) : 0;
            const specialty1Progress = cert.specialtyCeusRequired ? (specialty1Completed / cert.specialtyCeusRequired) * 100 : 0;
            const specialty2Completed = cert.specialtyCeusCategory2 ? relevantCeus.filter(c => c.category === cert.specialtyCeusCategory2).reduce((sum, ceu) => sum + (ceu.ceuHours || 0), 0) : 0;
            const specialty2Progress = cert.specialtyCeusRequired2 ? (specialty2Completed / cert.specialtyCeusRequired2) * 100 : 0;
            return { ...cert, type, ceusCompleted: totalHoursCompleted, progress, specialty1Completed, specialty1Progress, specialty2Completed, specialty2Progress };
        });
    }, [certifications, ceus]);

    const filteredCeus = useMemo(() => {
        if (ceuFilter === 'all') return ceus;
        return ceus.filter(ceu => ceu.certificationId === ceuFilter);
    }, [ceus, ceuFilter]);

    const handleOpenCertModal = (cert: Partial<Certification> | null) => { setEditingCert(cert); setIsCertModalOpen(true); };
    const handleCloseCertModal = () => { setIsCertModalOpen(false); setEditingCert(null); };
    const handleSaveCertification = async (data: Partial<Certification>) => {
        setIsSubmitting(true);
        try {
            if (editingCert?.id) { await updateCertification(userId, editingCert.id, data); alert("Credential updated!"); } 
            else { await addCertification(userId, data); alert("Credential added!"); }
            handleCloseCertModal();
            router.refresh();
        } catch (error) {
            console.error("Error saving credential:", error);
            alert("Failed to save credential.");
        } finally { setIsSubmitting(false); }
    };
    const handleDeleteCertification = async (id: string) => {
        if (window.confirm("Delete this credential and all its CEUs?")) {
            try {
                await deleteCertification(userId, id);
                alert("Credential deleted.");
                router.refresh();
            } catch (error) {
                console.error("Error deleting credential:", error);
                alert("Failed to delete credential.");
            }
        }
    };
    const handleOpenCeuModal = (certId: string, ceu: Partial<CEU> | null) => { 
        setSelectedCertForCeu(certId);
        setEditingCeu(ceu);
        setIsCeuModalOpen(true);
    };
    const handleCloseCeuModal = () => { 
        setIsCeuModalOpen(false); 
        setSelectedCertForCeu(null);
        setEditingCeu(null);
    };
    const handleSaveCeu = async (data: Partial<CEU>) => {
        if (!selectedCertForCeu) return;
        setIsSubmitting(true);
        try {
            if (editingCeu?.id) {
                await updateCEU(userId, { ...data, id: editingCeu.id });
                alert("CEU updated!");
            } else {
                await addCEU(userId, selectedCertForCeu, data);
                alert("CEU logged!");
            }
            handleCloseCeuModal();
            router.refresh();
        } catch (error) {
            console.error("Error saving CEU:", error);
            alert("Failed to save CEU.");
        } finally { setIsSubmitting(false); }
    };
    const handleDeleteCeu = async (ceuId: string) => {
        if (window.confirm("Delete this CEU entry?")) {
            try {
                await deleteCEU(userId, ceuId);
                alert("CEU deleted.");
                router.refresh();
            } catch (error) {
                console.error("Error deleting CEU:", error);
                alert("Failed to delete CEU.");
            }
        }
    };

    const handleOpenCeuDetailModal = (ceu: CEU) => {
        setSelectedCeuForDetail(ceu);
        setIsCeuDetailModalOpen(true);
    };

    const handleCloseCeuDetailModal = () => {
        setSelectedCeuForDetail(null);
        setIsCeuDetailModalOpen(false);
    };

    const certForCeu = certifications.find(c => c.id === selectedCertForCeu);
    const availableCategories = ['General Studies'];
    if (certForCeu?.specialtyCeusCategory) { availableCategories.push(certForCeu.specialtyCeusCategory); }
    if (certForCeu?.specialtyCeusCategory2) { availableCategories.push(certForCeu.specialtyCeusCategory2); }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Credentials</h1>
                        <p className="text-muted-foreground mt-1">Manage your licenses, certifications, and memberships.</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                         <button onClick={() => handleOpenCertModal(null)} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <PlusCircle size={20} /> Add Credential
                        </button>
                    </div>
                </header>

                <div className="border-b border-border"><nav className="-mb-px flex space-x-6"><button onClick={() => setActiveTab('certs')} className={`${activeTab === 'certs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>My Credentials</button><button onClick={() => setActiveTab('ceus')} className={`${activeTab === 'ceus' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>CEU Log</button></nav></div>
                
                <div className="mt-6">
                    {activeTab === 'certs' && (
                        <div className="space-y-4">
                            {certificationsWithCeus.map(cert => (
                                <div key={cert.id} className="bg-card p-4 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <div><h3 className="font-bold text-lg text-foreground flex items-center gap-2">{getIconForType(cert.type)} {cert.name}</h3><p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p><p className="text-xs text-muted-foreground mt-1">Expires: {cert.expirationDate || 'N/A'}</p></div>
                                        <div className="flex gap-2">
                                            {cert.type === 'certification' && (<button onClick={() => handleOpenCeuModal(cert.id!, null)} title="Log CEU" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"><BookOpen size={16}/></button>)}
                                            <button onClick={() => handleOpenCertModal(cert)} title="Edit Credential" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteCertification(cert.id!)} title="Delete Credential" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    {cert.type === 'certification' && cert.totalCeusRequired && cert.totalCeusRequired > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div>
                                                <div className="flex justify-between items-baseline mb-1"><span className="text-sm font-medium">Total CEUs</span><span className="text-sm text-muted-foreground">{cert.ceusCompleted.toFixed(1)} / {cert.totalCeusRequired.toFixed(1)} hours</span></div>
                                                <div className="w-full bg-background rounded-full h-2.5 border"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${cert.progress}%` } as React.CSSProperties}></div></div>
                                            </div>
                                            {cert.specialtyCeusCategory && cert.specialtyCeusRequired && (
                                                <div>
                                                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-medium">{cert.specialtyCeusCategory}</span><span className="text-xs text-muted-foreground">{cert.specialty1Completed.toFixed(1)} / {cert.specialtyCeusRequired.toFixed(1)} hours</span></div>
                                                    <div className="w-full bg-background rounded-full h-2 border"><div className="bg-teal-500 h-2 rounded-full" style={{ width: `${cert.specialty1Progress}%` } as React.CSSProperties}></div></div>
                                                </div>
                                            )}
                                            {cert.specialtyCeusCategory2 && cert.specialtyCeusRequired2 && (
                                                <div>
                                                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-medium">{cert.specialtyCeusCategory2}</span><span className="text-xs text-muted-foreground">{cert.specialty2Completed.toFixed(1)} / {cert.specialtyCeusRequired2.toFixed(1)} hours</span></div>
                                                    <div className="w-full bg-background rounded-full h-2 border"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${cert.specialty2Progress}%` } as React.CSSProperties}></div></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'ceus' && ( 
                        <div className="space-y-4"> 
                            <div className="max-w-xs"><label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Certification</label><select value={ceuFilter} onChange={(e) => setCeuFilter(e.target.value)} className="w-full p-2 border rounded-md bg-background"><option value="all">Show All</option>{certifications.map(cert => (<option key={cert.id} value={cert.id!}>{cert.name}</option>))}</select></div> 
                            {filteredCeus.map(ceu => (
                                <div key={ceu.id} onClick={() => handleOpenCeuDetailModal(ceu)} className="bg-card p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-muted">
                                    <div>
                                        <p className="font-semibold text-foreground flex items-center gap-2"><BookOpen size={14} /> {ceu.activityName}</p>
                                        <p className="text-sm text-muted-foreground pl-6">{ceu.ceuHours} hours on {ceu.dateCompleted}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenCeuModal(ceu.certificationId, ceu); }} title="Edit CEU" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCeu(ceu.id!); }} title="Delete CEU" className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {filteredCeus.length === 0 && (<div className="text-center py-12 text-muted-foreground"><p>No CEUs found for this filter.</p></div>)}
                        </div>
                    )}
                </div>
            </div>

            {isCertModalOpen && (<div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"><div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border p-6"><CertificationForm onSave={handleSaveCertification} onCancel={handleCloseCertModal} initialData={editingCert || {}} isSubmitting={isSubmitting}/></div></div>)}
            {isCeuModalOpen && (<div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"><div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border p-6">
                <CEUForm onSave={handleSaveCeu} onCancel={handleCloseCeuModal} initialData={editingCeu || {}} isSubmitting={isSubmitting} availableCategories={availableCategories} />
            </div></div>)}
            
            {isCeuDetailModalOpen && selectedCeuForDetail && (
                <CEUDetailModal
                    ceu={selectedCeuForDetail}
                    certificationName={certifications.find(c => c.id === selectedCeuForDetail.certificationId)?.name || 'Unknown'}
                    onClose={handleCloseCeuDetailModal}
                />
            )}
        </>
    );
}