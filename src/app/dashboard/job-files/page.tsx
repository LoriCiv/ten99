// src/app/dashboard/job-files/page.tsx
"use client";

import { Suspense } from 'react';
import JobFilesPageInternal from '@/components/JobFilesPageInternal';

// This wrapper is needed to safely use URL parameters for filtering.
export default function JobFilesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <JobFilesPageInternal />
        </Suspense>
    );
}
