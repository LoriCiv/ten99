import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isTaxable?: boolean;
}

export interface Differential {
    id: string;
    description: string;
    amount: number;
}

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
    differentials?: Differential[];
    paymentMethod?: 'direct_deposit' | 'check' | 'virtual' | 'cash' | 'other';
    bankPostedName?: string;
    payFrequency?: 'per_job' | 'weekly' | 'biweekly' | 'monthly';
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
    eventType: 'job' | 'personal' | 'billing' | 'education';
    subject: string;
    status: 'pending' | 'scheduled' | 'completed' | 'canceled' | 'canceled-billable' | 'pending-confirmation';
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
    createdAt?: Timestamp | FieldValue;
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
    priority?: number;
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
    website?: string;
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
    lineItems: LineItem[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
    paymentDetails?: string;
    paymentDate?: string;
    createdAt?: Timestamp | FieldValue;
}

export interface Expense {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    date: string;
    category: string;
    description: string;
    amount: number;
    receiptUrl?: string;
    notes?: string;
    clientId?: string;
    isReadOnly?: boolean;
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
    status?: 'new' | 'pending' | 'approved' | 'declined' | 'offer-pending' | 'offer-rescinded' | 'offer-sent' | 'archived-education';
    proposedDate?: string;
    proposedTime?: string;
    appointmentId?: string;
    type?: 'standard' | 'application' | 'offer' | 'inbound-offer';
    jobPostId?: string;
}

export interface Template {
    id?: string;
    userId?: string;
    name: string;
    subject: string;
    body: string;
    type: 'decline' | 'pending' | 'general' | 'approve';
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

export interface InvoiceLineItemTemplate {
    id: string;
    description: string;
    unitPrice: number;
    isTaxable?: boolean;
}

export interface UserProfile {
    id?: string;
    userId?: string;
    name?: string;
    photoUrl?: string;
    professionalTitle?: string;
    bio?: string;
    zipCode?: string;
    state?: string;
    isVirtual: boolean;
    skills?: string[];
    languages?: string[];
    jobHistory?: JobHistoryEntry[];
    education?: EducationEntry[];
    defaultInvoiceNotes?: string;
    defaultPaymentDetails?: string;
    estimatedStateTaxRate?: number;
    defaultTaxRate?: number;
    address?: string;
    phone?: string;
    email?: string;
    expenseCategories?: string[];
    invoiceLineItems?: InvoiceLineItemTemplate[];
    sendOverdueReminders?: boolean;
    monthlyPostCount?: number;
    postCountResetDate?: string;
    notifyOnNewMessage?: boolean;
    notifyOnJobMatch?: boolean;
    defaultForwardingEmail?: string;
    // ✅ This field was missing
    inboundEmailAddress?: string;
}

export interface JobPosting {
    id?: string;
    userId: string;
    title: string;
    description: string;
    jobType?: 'On-site' | 'Virtual' | 'Hybrid';
    location?: string;
    state?: string;
    zipCode?: string;
    rate?: string;
    contactEmail?: string;
    requiredSkills?: string[];
    isFilled: boolean;
    createdAt?: Timestamp;
    expiresAt?: Timestamp;
    pendingApplicantId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    reportCount?: number;
}

export interface Reminder {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    text: string;
    type: 'one-time' | 'recurring';
    frequency?: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    dateOfMonth?: number;
    reminderDate?: string;
}

export interface Mileage {
    id?: string;
    userId?: string;
    createdAt?: Timestamp;
    date: string;
    miles: number;
    purpose: string;
    startLocation?: string;
    endLocation?: string;
    notes?: string;
}