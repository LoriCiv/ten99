"use client";

import type { CEU } from '@/types/app-interfaces';
import { X, Calendar, BookOpen, DollarSign, Tag, Globe, Award } from 'lucide-react';

// Define the correct props the component should accept
interface CEUDetailModalProps {
  ceu: CEU;
  certificationName: string;
  onClose: () => void;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => {
    // Return null if the value is null, undefined, or an empty string
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">{icon} {label}</p>
            <p className="pl-7">{value}</p>
        </div>
    );
};

export default function CEUDetailModal({ ceu, certificationName, onClose }: CEUDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{ceu.activityName}</h2>
                        <p className="text-sm text-muted-foreground">CEU Details</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <DetailItem icon={<Award size={16} />} label="Associated Certification" value={certificationName} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={<BookOpen size={16} />} label="CEU Hours" value={`${ceu.ceuHours} hours`} />
                        <DetailItem icon={<Calendar size={16} />} label="Date Completed" value={ceu.dateCompleted} />
                        <DetailItem icon={<Tag size={16} />} label="Category" value={ceu.category} />
                        <DetailItem icon={<DollarSign size={16} />} label="Cost" value={ceu.cost ? `$${ceu.cost}`: null} />
                    </div>
                    <DetailItem icon={<Globe size={16} />} label="Provider / Website" value={ceu.provider || ceu.website} />
                </div>
            </div>
        </div>
    );
}