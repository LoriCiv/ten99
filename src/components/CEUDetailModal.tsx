// src/components/CEUDetailModal.tsx
"use client";

import type { CEU } from '@/types/app-interfaces';
import { X, Calendar, BookOpen, Building, Tag, DollarSign, Link as LinkIcon } from 'lucide-react';

interface CEUDetailModalProps {
    ceu: CEU;
    certificationName: string;
    onClose: () => void;
}

const DetailItem = ({ icon: Icon, label, value, isLink = false }: { icon: React.ElementType, label: string, value?: string | number | null, isLink?: boolean }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm">
            <Icon size={16} className="mr-3 mt-1 text-primary shrink-0"/>
            <div>
                <p className="font-semibold text-muted-foreground">{label}</p>
                {isLink && typeof value === 'string' ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline break-all">
                        {value}
                    </a>
                ) : (
                    <p className="font-medium text-foreground">{value}</p>
                )}
            </div>
        </div>
    );
};

export default function CEUDetailModal({ ceu, certificationName, onClose }: CEUDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg border relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                    <X size={20} />
                </button>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-foreground">{ceu.activityName}</h2>
                    <p className="text-muted-foreground">Continuing Education Unit Details</p>
                </div>

                <div className="px-6 pb-6 space-y-4 border-t pt-4">
                    <DetailItem icon={BookOpen} label="Certification" value={certificationName} />
                    <DetailItem icon={Calendar} label="Date Completed" value={ceu.dateCompleted} />
                    <DetailItem icon={Tag} label="CEU Hours" value={`${ceu.ceuHours} hours`} />
                    <DetailItem icon={Tag} label="Category" value={ceu.category} />
                    <DetailItem icon={Building} label="Provider" value={ceu.provider} />
                    <DetailItem icon={DollarSign} label="Cost" value={ceu.cost ? `$${ceu.cost.toFixed(2)}` : null} />
                    <DetailItem icon={LinkIcon} label="Website" value={ceu.website} isLink={true} />
                </div>
            </div>
        </div>
    );
}