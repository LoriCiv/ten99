"use client";

import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export default function Modal({ isOpen, onClose, children, className }: ModalProps) {
    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            {/* Solid Content Container */}
            <div
                className={clsx(
                    "bg-card text-card-foreground rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto border",
                    className || 'max-w-2xl'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}