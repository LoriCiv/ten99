import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch,
    getDoc,
    setDoc,
    where,
    getDocs,
    limit,
    Timestamp,
    runTransaction,
    DocumentReference,
    QueryDocumentSnapshot,
    collectionGroup,
    increment
} from 'firebase/firestore';
import type { Client, PersonalNetworkContact, JobFile, Appointment, Message, Template, Certification, CEU, UserProfile, Invoice, Expense, JobPosting, Reminder, Mileage, LineItem } from '@/types/app-interfaces';
import { v4 as uuidv4 } from 'uuid';

const cleanupObject = <T extends Record<string, unknown>>(data: T): Partial<T> => {
    const cleaned: Partial<T> = {};
    for (const key in data) {
        const value = data[key];
        if (Array.isArray(value)) {
            cleaned[key] = value;
        } else if (value !== undefined && value !== null && value !== '') {
            cleaned[key] = value;
        }
    }
    return cleaned;
};

const serializeData = <T extends object>(doc: T | null): T | null => {
    if (!doc) return null;
    const data: { [key: string]: any } = { ...doc };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data as T;
};

// --- REAL-TIME LISTENERS ---
export const getClients = (userId: string, callback: (data: Client[]) => void) => {
    const q = query(collection(db, `users/${userId}/clients`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Client))); });
};
export const getPersonalNetwork = (userId: string, callback: (data: PersonalNetworkContact[]) => void) => {
    const q = query(collection(db, `users/${userId}/personalNetwork`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as PersonalNetworkContact))); });
};
export const getJobFiles = (userId: string, callback: (data: JobFile[]) => void) => {
    const q = query(collection(db, `users/${userId}/jobFiles`));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as JobFile))); });
};
export const getAppointments = (userId: string, callback: (data: Appointment[]) => void) => {
    const q = query(collection(db, `users/${userId}/appointments`), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Appointment))); });
};
export const getMessagesForUser = (userId: string, callback: (data: Message[]) => void) => {
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(messagesRef, where('recipientId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Message))); });
};
export const getSentMessagesForUser = (userId: string, callback: (data: Message[]) => void) => {
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(messagesRef, where('senderId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Message))); });
};
export const getTemplates = (userId: string, callback: (data: Template[]) => void) => { const q = query(collection(db, `users/${userId}/templates`), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template))); }); };
export const getCertifications = (userId: string, callback: (data: Certification[]) => void) => { const q = query(collection(db, `users/${userId}/certifications`), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certification))); }); };
export const getAllCEUs = (userId: string, callback: (data: CEU[]) => void) => {
    const ceusQuery = query(collectionGroup(db, 'ceus'), where('userId', '==', userId));
    return onSnapshot(ceusQuery, (snapshot) => {
        const ceus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CEU));
        callback(ceus);
    });
};
export const getUserProfile = (userId: string, callback: (data: UserProfile | null) => void) => {
    const docRef = doc(db, `users/${userId}`);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
            callback(null);
        }
    });
};
export const getInvoices = (userId: string, callback: (data: Invoice[]) => void) => { const q = query(collection(db, `users/${userId}/invoices`), orderBy('invoiceDate', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))); }); };
export const getExpenses = (userId: string, callback: (data: Expense[]) => void) => { const q = query(collection(db, `users/${userId}/expenses`), orderBy('date', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))); }); };
export const getJobPostings = (callback: (data: JobPosting[]) => void, userProfile?: UserProfile | null) => {
    const now = new Date();
    let q = query(collection(db, 'jobPostings'), where('expiresAt', '>', now), orderBy('expiresAt', 'asc'));

    if (userProfile && Array.isArray(userProfile.states) && userProfile.states.length > 0) {
        q = query(q, where('state', 'in', userProfile.states));
    }

    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosting)))
    });
};
export const getReminders = (userId: string, callback: (data: Reminder[]) => void) => {
    // ✅ UPDATED: Now only fetches reminders that are not dismissed.
    const q = query(
        collection(db, `users/${userId}/reminders`),
        where('isDismissed', '!=', true),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder))); });
};
export const getMileage = (userId: string, callback: (data: Mileage[]) => void) => {
    const q = query(collection(db, `users/${userId}/mileage`), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mileage))); });
};
export const getPriorityJobFiles = (userId: string, callback: (data: JobFile[]) => void) => {
    const q = query(collection(db, `users/${userId}/jobFiles`), where('priority', '==', 2), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as JobFile))); });
};
export const getCeusForCertification = (userId: string, certId: string, callback: (data: CEU[]) => void) => {
    const q = query(collection(db, `users/${userId}/ceus`), where('certificationId', '==', certId));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CEU)));
    });
};

// --- ONE-TIME DATA FETCHERS ---
export const getJobFile = async (userId: string, jobFileId: string): Promise<JobFile | null> => {
    const docRef = doc(db, `users/${userId}/jobFiles`, jobFileId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) { return { id: docSnap.id, ...docSnap.data() } as JobFile; }
    return null;
};
export const getProfileData = async (userId: string): Promise<UserProfile | null> => {
    const docRef = doc(db, `users/${userId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) { return serializeData({ id: docSnap.id, ...docSnap.data() } as UserProfile); }
    return null;
};
export const getTemplatesData = async (userId: string): Promise<Template[]> => {
    const q = query(collection(db, `users/${userId}/templates`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as Template)).filter((item): item is Template => item !== null);
};
export const getRemindersData = async (userId: string): Promise<Reminder[]> => {
    const q = query(collection(db, `users/${userId}/reminders`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as Reminder)).filter((item): item is Reminder => item !== null);
};
export const getPublicUserProfile = async (userId: string): Promise<UserProfile | null> => { const docRef = doc(db, `users/${userId}`); const docSnap = await getDoc(docRef); if (docSnap.exists()) { return { id: docSnap.id, ...docSnap.data() } as UserProfile; } return null; };
export const getCertificationsData = async (userId: string): Promise<Certification[]> => {
    const q = query(collection(db, `users/${userId}/certifications`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as Certification)).filter((item): item is Certification => item !== null);
};
export const getAllCEUsData = async (userId: string): Promise<CEU[]> => {
    const ceusQuery = query(collectionGroup(db, 'ceus'), where('userId', '==', userId));
    const snapshot = await getDocs(ceusQuery);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as CEU)).filter((item): item is CEU => item !== null);
};
export const getJobPostingsData = async (): Promise<JobPosting[]> => {
    const now = new Date();
    const q = query(collection(db, 'jobPostings'), where('expiresAt', '>', now), orderBy('expiresAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => serializeData({ id: doc.id, ...doc.data() } as JobPosting)).filter((item): item is JobPosting => item !== null);
};
export const getClientForJobFile = async (userId: string, clientId: string): Promise<Client | null> => {
    const docRef = doc(db, 'users', userId, 'clients', clientId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Client : null;
};

// --- WRITE/UPDATE/DELETE FUNCTIONS ---
export const addClient = (userId: string, clientData: Partial<Client>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/clients`), { ...cleanupObject(clientData), createdAt: serverTimestamp() }); };
export const updateClient = (userId: string, clientId: string, clientData: Partial<Client>): Promise<void> => { return setDoc(doc(db, `users/${userId}/clients`, clientId), cleanupObject(clientData), { merge: true }); };
export const deleteClient = (userId: string, clientId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/clients`, clientId)); };
export const addPersonalNetworkContact = (userId: string, contactData: Partial<PersonalNetworkContact>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/personalNetwork`), { ...cleanupObject(contactData), createdAt: serverTimestamp() }); };
export const updatePersonalNetworkContact = (userId: string, contactId: string, contactData: Partial<PersonalNetworkContact>): Promise<void> => { const docRef = doc(db, `users/${userId}/personalNetwork`, contactId); return setDoc(docRef, cleanupObject(contactData), { merge: true }); };
export const deletePersonalNetworkContact = (userId: string, contactId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/personalNetwork`, contactId)); };
export const addJobFile = (userId: string, jobFileData: Partial<JobFile>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/jobFiles`), { ...cleanupObject(jobFileData), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); };
export const updateJobFile = (userId: string, jobFileId: string, jobFileData: Partial<JobFile>): Promise<void> => { const dataToSave = { ...cleanupObject(jobFileData), updatedAt: serverTimestamp() }; return updateDoc(doc(db, `users/${userId}/jobFiles`, jobFileId), dataToSave); };
export const deleteJobFile = (userId: string, jobFileId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/jobFiles`, jobFileId)); };
export const createPublicJobFile = async (userId: string, jobFile: JobFile): Promise<string | null> => {
    if (!jobFile.id) return null;
    const jobFileRef = doc(db, 'users', userId, 'jobFiles', jobFile.id);
    if (jobFile.publicId) {
        await updateDoc(jobFileRef, { isShared: true });
        return jobFile.publicId;
    }
    const newPublicId = uuidv4();
    await updateDoc(jobFileRef, {
        isShared: true,
        publicId: newPublicId,
        originalUserId: userId
    });
    return newPublicId;
};
export const uploadFile = async (userId: string, file: File): Promise<string> => {
    if (!file) { throw new Error("No file provided for upload."); }
    const filePath = `users/${userId}/uploads/${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};
export const addAppointment = async (userId: string, appointmentData: Partial<Appointment>, recurrenceEndDate?: string): Promise<string | void> => {
    const dataToSave = { ...cleanupObject(appointmentData), createdAt: serverTimestamp() };
    if (appointmentData.recurrence && recurrenceEndDate && appointmentData.date) {
        const batch = writeBatch(db);
        const seriesId = uuidv4();
        let movingDate = new Date(appointmentData.date + 'T00:00:00');
        const endDate = new Date(recurrenceEndDate + 'T00:00:00');
        while (movingDate <= endDate) {
            const newDocRef = doc(collection(db, `users/${userId}/appointments`));
            const appointmentForDate = { ...dataToSave, date: movingDate.toISOString().split('T')[0], seriesId: seriesId };
            batch.set(newDocRef, appointmentForDate);
            switch (appointmentData.recurrence) {
                case 'daily': movingDate.setDate(movingDate.getDate() + 1); break;
                case 'weekly': movingDate.setDate(movingDate.getDate() + 7); break;
                case 'biweekly': movingDate.setDate(movingDate.getDate() + 14); break;
                case 'monthly': movingDate.setMonth(movingDate.getMonth() + 1); break;
                default: movingDate.setDate(endDate.getDate() + 1); break;
            }
        }
        await batch.commit();
    } else {
        const docRef = await addDoc(collection(db, `users/${userId}/appointments`), dataToSave);
        return docRef.id;
    }
};
export const updateAppointment = (userId: string, appointmentId: string, appointmentData: Partial<Appointment>): Promise<void> => { const appointmentRef = doc(db, `users/${userId}/appointments`, appointmentId); return updateDoc(appointmentRef, cleanupObject(appointmentData)); };
export const deleteAppointment = (userId: string, appointmentId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/appointments`, appointmentId)); };
export const updateMessage = (userId: string, messageId: string, messageData: Partial<Message>): Promise<void> => { const messageRef = doc(db, 'users', userId, 'messages', messageId); return updateDoc(messageRef, cleanupObject(messageData)); };
export const deleteMessage = (userId: string, messageId: string): Promise<void> => { const messageRef = doc(db, `users/${userId}/messages`, messageId); return deleteDoc(messageRef); };

const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
};

export const sendAppMessage = async (senderId: string, senderName: string, recipients: string[], subject: string, body: string, type: Message['type'] = 'standard', jobPostId?: string): Promise<void> => {
    console.log(`[sendAppMessage] Initiated by sender ${senderName} (${senderId})`);
    try {
        const senderProfileSnap = await getDoc(doc(db, `users/${senderId}`));
        const senderEmail = senderProfileSnap.exists() && senderProfileSnap.data().email ? senderProfileSnap.data().email : 'noreply@ten99.app';
        
        const internalRecipients: string[] = [];
        const externalRecipients: string[] = [];
        for (const recipient of recipients) {
            if (recipient.includes('@')) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("email", "==", recipient), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    internalRecipients.push(querySnapshot.docs[0].id);
                } else {
                    externalRecipients.push(recipient);
                }
            } else {
                internalRecipients.push(recipient);
            }
        }
        const batch = writeBatch(db);
        const timestamp = serverTimestamp();
        for (const recipientId of internalRecipients) {
            const messageData: Partial<Message> = { senderId, senderName, recipientId, subject, body, isRead: false, status: 'new', createdAt: timestamp, type, jobPostId };
            const recipientMessageRef = doc(collection(db, `users/${recipientId}/messages`));
            batch.set(recipientMessageRef, cleanupObject(messageData));
        }
        const sentMessageData: Partial<Message> = {
            senderId, senderName, recipientId: recipients.join(', '), subject, body,
            isRead: true, status: 'new', createdAt: timestamp, type, jobPostId
        };
        const senderMessageRef = doc(collection(db, `users/${senderId}/messages`));
        batch.set(senderMessageRef, cleanupObject(sentMessageData));
        await batch.commit();
        if (externalRecipients.length > 0) {
            const apiUrl = `${getBaseUrl()}/api/send-email`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({
                    userId: senderId,
                    to: externalRecipients,
                    subject,
                    html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
                    replyToEmail: senderEmail
                }),
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to send external email. Status: ${response.status}. Body: ${errorBody}`);
            }
        }
    } catch (error) {
        console.error('[sendAppMessage] 🔴 An error occurred:', error);
        throw error;
    }
};
export const addTemplate = (userId: string, templateData: Partial<Template>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/templates`), { ...cleanupObject(templateData), createdAt: serverTimestamp() }); };
export const updateTemplate = (userId: string, templateId: string, templateData: Partial<Template>): Promise<void> => { const docRef = doc(db, `users/${userId}/templates`, templateId); return setDoc(docRef, cleanupObject(templateData), { merge: true }); };
export const deleteTemplate = (userId: string, templateId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/templates`, templateId)); };
export const addCertification = (userId: string, certData: Partial<Certification>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/certifications`), { ...cleanupObject(certData), createdAt: serverTimestamp() }); };
export const updateCertification = (userId: string, certId: string, certData: Partial<Certification>): Promise<void> => { const docRef = doc(db, `users/${userId}/certifications`, certId); return setDoc(docRef, cleanupObject(certData), { merge: true }); };
export const deleteCertification = async (userId: string, certId: string): Promise<void> => { const batch = writeBatch(db); const certRef = doc(db, `users/${userId}/certifications`, certId); const ceusQuery = query(collectionGroup(db, 'ceus'), where('certificationId', '==', certId), where('userId', '==', userId)); const ceusSnapshot = await getDocs(ceusQuery); ceusSnapshot.forEach(doc => batch.delete(doc.ref)); batch.delete(certRef); await batch.commit(); };
export const addCEU = (userId: string, certId: string, ceuData: Partial<CEU>): Promise<DocumentReference> => { const dataToSave = { ...cleanupObject(ceuData), userId, certificationId: certId, createdAt: serverTimestamp() }; return addDoc(collection(db, `users/${userId}/ceus`), dataToSave); };
export const deleteCEU = (userId:string, ceuId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/ceus`, ceuId)); };
export const updateCEU = (userId: string, ceuData: Partial<CEU>): Promise<void> => { if (!ceuData.id) { return Promise.reject("CEU ID is required for update."); } const docRef = doc(db, `users/${userId}/ceus`, ceuData.id); return setDoc(docRef, cleanupObject(ceuData), { merge: true }); };
export const updateUserProfile = (userId: string, profileData: Partial<UserProfile>): Promise<void> => { const docRef = doc(db, `users/${userId}`); return setDoc(docRef, profileData, { merge: true }); };
const generateNextInvoiceNumber = async (userId: string): Promise<string> => { const metaRef = doc(db, `users/${userId}/_metadata`, 'invoiceCounter'); const year = new Date().getFullYear(); try { const newInvoiceNumber = await runTransaction(db, async (transaction) => { const metaDoc = await transaction.get(metaRef); if (!metaDoc.exists()) { transaction.set(metaRef, { lastNumber: 1, year: year }); return `${year}-001`; } const data = metaDoc.data(); if(!data) { transaction.set(metaRef, { lastNumber: 1, year: year }); return `${year}-001`; } const lastNumber = data.year === year ? data.lastNumber : 0; const nextNumber = lastNumber + 1; transaction.update(metaRef, { lastNumber: nextNumber, year: year }); return `${year}-${String(nextNumber).padStart(3, '0')}`; }); return newInvoiceNumber; } catch (error) { console.error("Transaction failed: ", error); return `${year}-${Date.now().toString().slice(-5)}`; } };
export const getNextInvoiceNumber = async (userId: string): Promise<string> => { return generateNextInvoiceNumber(userId); };
export const addInvoice = async (userId: string, invoiceData: Partial<Invoice>): Promise<void> => { if (!invoiceData.invoiceNumber) { invoiceData.invoiceNumber = await getNextInvoiceNumber(userId); } const dataToSave = { ...cleanupObject(invoiceData), createdAt: serverTimestamp(), }; await addDoc(collection(db, `users/${userId}/invoices`), dataToSave); };
export const updateInvoice = (userId: string, invoiceId: string, invoiceData: Partial<Invoice>): Promise<void> => { const docRef = doc(db, `users/${userId}/invoices`, invoiceId); return setDoc(docRef, cleanupObject(invoiceData), { merge: true }); };
export const deleteInvoice = (userId: string, invoiceId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/invoices`, invoiceId)); };
const calculateDurationInHours = (startTime?: string, endTime?: string): number => { if (!startTime || !endTime) return 1; const start = new Date(`1970-01-01T${startTime}`); const end = new Date(`1970-01-01T${endTime}`); const diffMs = end.getTime() - start.getTime(); if (diffMs <= 0) return 1; return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); };
export const createInvoiceFromAppointment = async (userId: string, appointment: Appointment): Promise<void> => {
    if (!appointment.clientId || !appointment.id) { throw new Error("Appointment must have an ID and be linked to a client."); }
    const clientRef = doc(db, `users/${userId}/clients`, appointment.clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) { throw new Error("Client not found for this appointment."); }
    const client = clientSnap.data() as Client;
    const rate = client.rate || 0;
    const duration = calculateDurationInHours(appointment.time, appointment.endTime);
    const description = `${appointment.subject || 'Services Rendered'}\nDate: ${appointment.date}`;
    const lineItems: LineItem[] = [{ description, quantity: duration, unitPrice: rate, total: duration * rate, isTaxable: true }];
    if (client.differentials && client.differentials.length > 0) {
        client.differentials.forEach(diff => {
            lineItems.push({ description: diff.description, quantity: 1, unitPrice: diff.amount, total: diff.amount, isTaxable: true });
        });
    }
    const subtotal = lineItems.reduce((sum, lineItem) => sum + lineItem.total, 0);
    const total = subtotal;
    const invoiceData: Partial<Invoice> = {
        clientId: appointment.clientId, appointmentId: appointment.id, invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'draft',
        lineItems: lineItems, subtotal: subtotal, total: total,
    };
    await addInvoice(userId, invoiceData);
};
export const addExpense = (userId: string, expenseData: Partial<Expense>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/expenses`), { ...cleanupObject(expenseData), createdAt: serverTimestamp() }); };
export const updateExpense = (userId: string, expenseId: string, expenseData: Partial<Expense>): Promise<void> => { return setDoc(doc(db, `users/${userId}/expenses`, expenseId), cleanupObject(expenseData), { merge: true }); };
export const deleteExpense = (userId: string, expenseId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/expenses`, expenseId)); };
export const addReminder = (userId: string, reminderData: Partial<Reminder>): Promise<DocumentReference> => {
    // ✅ UPDATED: Sets isDismissed to false on creation
    const dataToSave = { ...cleanupObject(reminderData), isDismissed: false, createdAt: serverTimestamp() };
    return addDoc(collection(db, `users/${userId}/reminders`), dataToSave);
};
export const updateReminder = (userId: string, reminderId: string, data: Partial<Reminder>): Promise<void> => {
    const reminderRef = doc(db, `users/${userId}/reminders`, reminderId);
    return updateDoc(reminderRef, data);
};
export const deleteReminder = (userId: string, reminderId: string): Promise<void> => {
    return deleteDoc(doc(db, `users/${userId}/reminders`, reminderId));
};
export const addMileage = (userId: string, mileageData: Partial<Mileage>): Promise<DocumentReference> => {
    return addDoc(collection(db, `users/${userId}/mileage`), { ...cleanupObject(mileageData), createdAt: serverTimestamp() });
};
export const deleteMileage = (userId: string, mileageId: string): Promise<void> => {
    return deleteDoc(doc(db, `users/${userId}/mileage`, mileageId));
};

// --- JOB BOARD FUNCTIONS ---
export const addJobPosting = async (userId: string, jobData: Partial<JobPosting>): Promise<DocumentReference> => {
    const dataToSave = {
        ...cleanupObject(jobData),
        userId,
        isFilled: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30-day expiration
    };
    return addDoc(collection(db, 'jobPostings'), dataToSave);
};

export const getJobPostingById = async (postId: string): Promise<JobPosting | null> => {
    const docRef = doc(db, 'jobPostings', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as JobPosting;
    }
    return null;
};

export const sendJobApplicationMessage = async (applicantId: string, applicantProfile: UserProfile, jobPost: JobPosting): Promise<void> => {
    const jobOwnerId = jobPost.userId;
    const subject = `New Application for "${jobPost.title}" from ${applicantProfile.name}`;
    const body = `${applicantProfile.name} has applied for your job posting: "${jobPost.title}".\n\nYou can view their profile or contact them to proceed.`;
    
    await sendAppMessage(applicantId, applicantProfile.name || 'A Ten99 User', [jobOwnerId], subject, body, 'application', jobPost.id);
};

export const sendJobOffer = async (applicationMessage: Message): Promise<void> => {
    if (!applicationMessage.jobPostId || !applicationMessage.id) return;
    const batch = writeBatch(db);
    
    // Update the application message status for the job poster
    const posterMessageRef = doc(db, 'users', applicationMessage.recipientId, 'messages', applicationMessage.id);
    batch.update(posterMessageRef, { status: 'offer-pending' });
    
    // Update the job post to mark a pending applicant
    const jobPostRef = doc(db, 'jobPostings', applicationMessage.jobPostId);
    batch.update(jobPostRef, { pendingApplicantId: applicationMessage.senderId });

    // Send a new "offer" message to the applicant
    const offerSubject = `Job Offer for "${applicationMessage.subject.replace('New Application for ', '')}"`;
    const offerBody = `Congratulations! You have received a job offer. Please review and respond.`;
    
    // We need the job poster's name for the message
    const jobPosterProfileSnap = await getDoc(doc(db, 'users', applicationMessage.recipientId));
    const jobPosterName = jobPosterProfileSnap.exists() ? jobPosterProfileSnap.data().name : "The Job Poster";

    // This is an internal function call, so it's okay to call it directly.
    // It creates the message docs in Firestore.
    const offerMessageData: Partial<Message> = {
        senderId: applicationMessage.recipientId,
        senderName: jobPosterName,
        recipientId: applicationMessage.senderId,
        subject: offerSubject,
        body: offerBody,
        isRead: false,
        status: 'new',
        createdAt: serverTimestamp(),
        type: 'offer',
        jobPostId: applicationMessage.jobPostId
    };
    const applicantMessageRef = doc(collection(db, `users/${applicationMessage.senderId}/messages`));
    batch.set(applicantMessageRef, offerMessageData);
    
    const sentOfferCopyRef = doc(collection(db, `users/${applicationMessage.recipientId}/messages`));
    batch.set(sentOfferCopyRef, { ...offerMessageData, recipientId: applicationMessage.senderId, isRead: true });
    
    await batch.commit();
};

// ... other job board functions would continue here ...

// --- MAGIC MAILBOX ACTION FUNCTIONS ---
export const confirmInboundOffer = async (userId: string, message: Message): Promise<void> => { /* implementation needed */ };
export const acceptInboundOfferPending = async (userId: string, message: Message): Promise<void> => { /* implementation needed */ };
export const declineInboundOffer = async (userId: string, message: Message): Promise<void> => { /* implementation needed */ };
export const markAsEducation = async (userId: string, message: Message): Promise<void> => { /* implementation needed */ };
export const createEducationAppointmentFromMessage = async (userId: string, message: Message, appointmentData: Partial<Appointment>): Promise<void> => { /* implementation needed */ };