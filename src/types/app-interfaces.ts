// src/types/app-interfaces.ts
import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface Client {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    clientType: 'business_1099' | 'individual_1099' | 'employer_w2';
    companyName?: string;
    name: string;
    status: 'Active' | 'Inactive' | 'Lead';
    jobTitle?: string;
    email?: string;
    billingEmail?: string;
    phone?: string;
    address?: string;
    website?: string;
    notes?: string;
    rate?: number;
    differentials?: string;
    payFrequency?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
    federalWithholding?: number;
    stateWithholding?: number;
}

export interface PersonalNetworkContact {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    tags?: string[];
    clientId?: string;
}

export interface Appointment {
    id?: string;
    userId?: string;
    createdAt?: Timestamp | FieldValue;
    eventType: 'job' | 'personal' | 'billing';
    subject: string;
    status: 'pending' | 'scheduled' | 'completed' | 'canceled' | 'canceled-billable';
    date: string;
    time: string;
    endTime?: string;
    clientId?: string;
    contactId?: string;
    jobFileId?: string;
    jobType?: string;
    locationType?: 'physical' | 'virtual' | '';
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    virtualLink?: string;
    notes?: string;
    jobNumber?: string;
    recurrence?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    seriesId?: string;
}

export interface JobFile {
    id?: string;
    userId?: string;
    originalUserId?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    jobTitle: string;
    fileUrl?: string;
    sharedNotes?: string;
    privateNotes?: string;
    appointmentId?: string;
    clientId?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    isPinned?: boolean;
}

export interface Certification {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    type: 'certification' | 'license' | 'membership';
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
    renewalCost?: number;
    credentialId?: string;
    credentialUrl?: string;
    notes?: string;
    totalCeusRequired?: number;
    specialtyCeusCategory?: string;
    specialtyCeusRequired?: number;
    specialtyCeusCategory2?: string;
    specialtyCeusRequired2?: number;
}

export interface CEU {
    id?: string;
    userId?: string;
    certificationId: string;
    createdAt?: Timestamp;
    activityName: string;
    dateCompleted: string;
    ceuHours: number;
    provider?: string;
    cost?: number;
    category?: string;
}

export interface Invoice {
    id?: string;
    userId?: string;
    invoiceNumber: string;
    clientId: string;
    appointmentId?: string;
    invoiceDate: string;
    dueDate: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
    paymentDetails?: string;
    paymentDate?: string;
}

export interface Message {
    id?: string;
    userId?: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    subject: string;
    body: string;
    isRead: boolean;
    createdAt: Timestamp | FieldValue;
    status?: 'new' | 'pending' | 'approved' | 'declined';
    proposedDate?: string;
    proposedTime?: string;
    appointmentId?: string;
}

export interface Template {
    id?: string;
    userId?: string;
    name: string;
    subject: string;
    body: string;
    type: 'decline' | 'pending' | 'general';
    createdAt?: Timestamp | FieldValue;
}

export interface JobHistoryEntry {
    title: string;
    company: string;
    years: string;
}

export interface EducationEntry {
    degree: string;
    institution: string;
    notes?: string;
}

export interface UserProfile {
    id?: string;
    userId?: string;
    name?: string;
    photoUrl?: string;
    professionalTitle?: string;
    bio?: string;
    address?: string;
    phone?: string;
    zipCode?: string;
    isVirtual: boolean;
    skills?: string[];
    languages?: string[];
    jobHistory?: JobHistoryEntry[];
    education?: EducationEntry[];
    estimatedStateTaxRate?: number;
    defaultInvoiceNotes?: string;
    defaultPaymentDetails?: string;
}

export interface Expense {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    date: string;
    category: 'travel' | 'equipment' | 'supplies' | 'professional_development' | 'other';
    description: string; // ✅ THE FIX IS HERE
    amount: number;
    receiptUrl?: string;
}

export interface JobPosting {
    id?: string;
    userId: string;
    title: string;
    description: string;
    location?: string;
    rate?: string;
    requiredSkills?: string[];
    isFilled: boolean;
    createdAt?: Timestamp;
}