import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, getDoc, setDoc, where, getDocs, limit, Timestamp, runTransaction, DocumentReference, QueryDocumentSnapshot, collectionGroup, increment } from 'firebase/firestore';
import type { Client, PersonalNetworkContact, JobFile, Appointment, Message, Template, Certification, CEU, UserProfile, Invoice, Expense, JobPosting, Reminder, Mileage, Differential, LineItem } from '@/types/app-interfaces';
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
export const getJobFile = (userId: string, jobFileId: string, callback: (data: JobFile | null) => void) => {
    const jobFileRef = doc(db, 'users', userId, 'jobFiles', jobFileId);
    return onSnapshot(jobFileRef, (docSnap) => { if (docSnap.exists()) { callback({ id: docSnap.id, ...docSnap.data() } as JobFile); } else { callback(null); } });
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
export const getUserProfile = (userId: string, callback: (data: UserProfile | null) => void) => { const docRef = doc(db, `users/${userId}/profile`, 'mainProfile'); return onSnapshot(docRef, (docSnap) => { if (docSnap.exists()) { callback({ id: docSnap.id, ...docSnap.data() } as UserProfile); } else { callback(null); } }); };
export const getInvoices = (userId: string, callback: (data: Invoice[]) => void) => { const q = query(collection(db, `users/${userId}/invoices`), orderBy('invoiceDate', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))); }); };
export const getExpenses = (userId: string, callback: (data: Expense[]) => void) => { const q = query(collection(db, `users/${userId}/expenses`), orderBy('date', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))); }); };
export const getJobPostings = (callback: (data: JobPosting[]) => void) => {
    const now = new Date();
    const q = query(collection(db, 'jobPostings'), where('expiresAt', '>', now), orderBy('expiresAt', 'asc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosting))) });
};
export const getRecentInvoices = (userId: string, callback: (data: Invoice[]) => void) => {
    const q = query(collection(db, `users/${userId}/invoices`), orderBy('createdAt', 'desc'), limit(5));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))); });
};
export const getPriorityJobFiles = (userId: string, callback: (data: JobFile[]) => void) => {
    const q = query(collection(db, `users/${userId}/jobFiles`), where('priority', '==', 2), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as JobFile))); });
};
export const getReminders = (userId: string, callback: (data: Reminder[]) => void) => {
    const q = query(collection(db, `users/${userId}/reminders`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder))); });
};
export const getMileage = (userId: string, callback: (data: Mileage[]) => void) => {
    const q = query(collection(db, `users/${userId}/mileage`), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mileage))); });
};

// --- SERVER-SIDE DATA FETCHERS ---
export const getProfileData = async (userId: string): Promise<UserProfile | null> => {
    const docRef = doc(db, `users/${userId}/profile`, 'mainProfile');
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
export const getPublicUserProfile = async (userId: string): Promise<UserProfile | null> => { const docRef = doc(db, `users/${userId}/profile`, 'mainProfile'); const docSnap = await getDoc(docRef); if (docSnap.exists()) { return { id: docSnap.id, ...docSnap.data() } as UserProfile; } return null; };
export const getPublicCertifications = async (userId: string): Promise<Certification[]> => {
    const q = query(collection(db, `users/${userId}/certifications`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certification));
};

// ✅ ADD THESE TWO FUNCTIONS BACK
export const getPublicJobFile = async (publicId: string): Promise<JobFile | null> => { 
    const docRef = doc(db, "publicJobFiles", publicId); 
    const docSnap = await getDoc(docRef); 
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as JobFile : null; 
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
export const convertClientToContact = async (userId: string, client: Client): Promise<void> => { if (!client.id) throw new Error("Client ID is missing for conversion."); const newContactData = { name: client.companyName || client.name || 'Unknown', email: client.email, phone: client.phone, notes: client.notes, tags: ['converted-from-client'], createdAt: client.createdAt || serverTimestamp() }; const batch = writeBatch(db); const oldClientRef = doc(db, `users/${userId}/clients`, client.id); const newContactRef = doc(db, `users/${userId}/personalNetwork`, client.id); batch.set(newContactRef, cleanupObject(newContactData)); batch.delete(oldClientRef); await batch.commit(); };
export const convertContactToClient = async (userId: string, contact: PersonalNetworkContact): Promise<void> => { if (!contact.id) throw new Error("Contact ID is missing for conversion."); const newClientData = { name: contact.name, companyName: contact.name, email: contact.email, phone: contact.phone, notes: contact.notes, status: 'Active' as const, clientType: 'business_1099' as const, createdAt: contact.createdAt || serverTimestamp() }; const batch = writeBatch(db); const oldContactRef = doc(db, `users/${userId}/personalNetwork`, contact.id); const newClientRef = doc(db, `users/${userId}/clients`, contact.id); batch.set(newClientRef, cleanupObject(newClientData)); batch.delete(oldContactRef); await batch.commit(); };
export const addJobFile = (userId: string, jobFileData: Partial<JobFile>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/jobFiles`), { ...cleanupObject(jobFileData), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); };
export const updateJobFile = (userId: string, jobFileId: string, jobFileData: Partial<JobFile>): Promise<void> => { const dataToSave = { ...cleanupObject(jobFileData), updatedAt: serverTimestamp() }; return updateDoc(doc(db, `users/${userId}/jobFiles`, jobFileId), dataToSave); };
export const deleteJobFile = (userId: string, jobFileId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/jobFiles`, jobFileId)); };
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
export const addMessage = async (userId: string, messageData: Partial<Message>): Promise<string> => {
    const dataToSave = { ...cleanupObject(messageData), createdAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, `users/${userId}/messages`), dataToSave);
    return docRef.id;
};
export const sendAppMessage = async (senderId: string, senderName: string, recipientIdOrEmail: string, subject: string, body: string, type: Message['type'] = 'standard', jobPostId?: string): Promise<void> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", recipientIdOrEmail), limit(1));
    const querySnapshot = await getDocs(q);
    let recipientId = recipientIdOrEmail;
    if (!querySnapshot.empty) { recipientId = querySnapshot.docs[0].id; }
    const messageData: Partial<Message> = { senderId, senderName, recipientId, subject, body, isRead: false, status: 'new', createdAt: serverTimestamp(), type, jobPostId };
    const sentMessageData: Partial<Message> = { ...messageData, isRead: true };
    await addDoc(collection(db, `users/${senderId}/messages`), cleanupObject(sentMessageData));
    if (!querySnapshot.empty) { await addDoc(collection(db, `users/${recipientId}/messages`), cleanupObject(messageData)); } else { await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromName: senderName, to: recipientIdOrEmail, subject, html: `<p>${body.replace(/\n/g, '<br>')}</p><p>Sent by ${senderName} via the Ten99 App.</p>` }), }); }
};
export const addTemplate = (userId: string, templateData: Partial<Template>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/templates`), { ...cleanupObject(templateData), createdAt: serverTimestamp() }); };
export const updateTemplate = (userId: string, templateId: string, templateData: Partial<Template>): Promise<void> => { const docRef = doc(db, `users/${userId}/templates`, templateId); return setDoc(docRef, cleanupObject(templateData), { merge: true }); };
export const deleteTemplate = (userId: string, templateId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/templates`, templateId)); };
export const addCertification = (userId: string, certData: Partial<Certification>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/certifications`), { ...cleanupObject(certData), createdAt: serverTimestamp() }); };
export const updateCertification = (userId: string, certId: string, certData: Partial<Certification>): Promise<void> => { const docRef = doc(db, `users/${userId}/certifications`, certId); return setDoc(docRef, cleanupObject(certData), { merge: true }); };
export const deleteCertification = async (userId: string, certId: string): Promise<void> => { const batch = writeBatch(db); const certRef = doc(db, `users/${userId}/certifications`, certId); const ceusQuery = query(collectionGroup(db, 'ceus'), where('certificationId', '==', certId), where('userId', '==', userId)); const ceusSnapshot = await getDocs(ceusQuery); ceusSnapshot.forEach(doc => batch.delete(doc.ref)); batch.delete(certRef); await batch.commit(); };
export const addCEU = (userId: string, certId: string, ceuData: Partial<CEU>): Promise<DocumentReference> => { const dataToSave = { ...cleanupObject(ceuData), userId, certificationId: certId, createdAt: serverTimestamp() }; return addDoc(collection(db, `users/${userId}/ceus`), dataToSave); };
export const deleteCEU = (userId: string, ceuId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/ceus`, ceuId)); };
export const updateCEU = (userId: string, ceuData: Partial<CEU>): Promise<void> => { if (!ceuData.id) { return Promise.reject("CEU ID is required for update."); } const docRef = doc(db, `users/${userId}/ceus`, ceuData.id); return setDoc(docRef, cleanupObject(ceuData), { merge: true }); };
export const updateUserProfile = (userId: string, profileData: Partial<UserProfile>): Promise<void> => { const docRef = doc(db, `users/${userId}/profile`, 'mainProfile'); return setDoc(docRef, profileData, { merge: true }); };
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
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
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

// --- JOB BOARD FUNCTIONS ---
export const addJobPosting = async (userId: string, jobData: Partial<JobPosting>): Promise<DocumentReference> => {
    const profileRef = doc(db, `users/${userId}/profile`, 'mainProfile');
    const newPostRef = await runTransaction(db, async (transaction) => {
        const userProfileSnap = await transaction.get(profileRef);
        if (!userProfileSnap.exists()) { throw new Error("User profile not found."); }
        const userProfile = userProfileSnap.data() as UserProfile;
        const postLimit = 2;
        const currentMonthYear = `${new Date().getFullYear()}-${new Date().getMonth()}`;
        if (userProfile.postCountResetDate === currentMonthYear && (userProfile.monthlyPostCount || 0) >= postLimit) {
            // throw new Error(`You have reached your monthly limit of ${postLimit} job posts.`);
        }
        const newCount = userProfile.postCountResetDate === currentMonthYear ? (userProfile.monthlyPostCount || 0) + 1 : 1;
        transaction.update(profileRef, { monthlyPostCount: newCount, postCountResetDate: currentMonthYear });
        const createdAt = serverTimestamp();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const dataToSave = { ...cleanupObject(jobData), userId, isFilled: false, createdAt, expiresAt: Timestamp.fromDate(thirtyDaysFromNow), contactEmail: userProfile.email || '', };
        const newDocRef = doc(collection(db, 'jobPostings'));
        transaction.set(newDocRef, dataToSave);
        return newDocRef;
    });
    return newPostRef;
};
export const getJobPostingById = async (postId: string): Promise<JobPosting | null> => {
    const docRef = doc(db, "jobPostings", postId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as JobPosting : null;
};
export const sendJobApplicationMessage = async (applicantId: string, applicantProfile: UserProfile, jobPost: JobPosting): Promise<void> => {
    if (applicantId === jobPost.userId) { throw new Error("You cannot apply to your own job posting."); }
    const applicantName = applicantProfile.name || 'A freelancer';
    const profileUrl = `${window.location.origin}/profile/${applicantId}`;
    await sendAppMessage(applicantId, applicantName, jobPost.userId, `Application for: ${jobPost.title}`, `${applicantName} has applied for your job posting, "${jobPost.title}".\n\nYou can view their public profile here:\n${profileUrl}`, 'application', jobPost.id);
};
export const sendJobOffer = async (applicationMessage: Message): Promise<void> => {
    if (!applicationMessage.id || !applicationMessage.jobPostId) throw new Error("Message is not a valid application.");
    const jobPostRef = doc(db, 'jobPostings', applicationMessage.jobPostId);
    const jobPostSnap = await getDoc(jobPostRef);
    if (!jobPostSnap.exists()) throw new Error("Job post not found.");
    const jobPost = jobPostSnap.data() as JobPosting;
    if (jobPost.pendingApplicantId) throw new Error("An offer is already pending for this job.");
    const batch = writeBatch(db);
    batch.update(jobPostRef, { pendingApplicantId: applicationMessage.senderId });
    const originalMessageRef = doc(db, 'users', applicationMessage.recipientId, 'messages', applicationMessage.id);
    batch.update(originalMessageRef, { status: 'offer-pending' });
    await batch.commit();
    await sendAppMessage(applicationMessage.recipientId, "Job Poster", applicationMessage.senderId, `Job Offer for: ${jobPost.title}`, `Congratulations! You have been offered the job for "${jobPost.title}". Please review the offer and accept or decline it from your mailbox.`, 'offer', jobPost.id);
};
export const declineJobApplication = async (applicationMessage: Message): Promise<void> => {
    if (!applicationMessage.id) return;
    await sendAppMessage(applicationMessage.recipientId, "Job Poster", applicationMessage.senderId, `Regarding your application for: ${applicationMessage.subject.replace('Application for: ', '')}`, `Thank you for your interest. Unfortunately, another candidate has been selected. We wish you the best in your job search.`);
    const originalMessageRef = doc(db, 'users', applicationMessage.recipientId, 'messages', applicationMessage.id);
    await updateDoc(originalMessageRef, { status: 'declined' });
};
export const acceptJobOffer = async (offerMessage: Message): Promise<void> => {
    if (!offerMessage.id || !offerMessage.jobPostId || offerMessage.type !== 'offer') throw new Error("Invalid offer message.");
    const jobPost = await getJobPostingById(offerMessage.jobPostId);
    if (!jobPost) throw new Error("Job posting not found.");
    if (jobPost.isFilled) throw new Error("This job has already been filled.");
    const batch = writeBatch(db);
    const jobPostRef = doc(db, 'jobPostings', jobPost.id!);
    batch.update(jobPostRef, { isFilled: true, pendingApplicantId: '' });
    const offerMessageRef = doc(db, 'users', offerMessage.recipientId, 'messages', offerMessage.id);
    batch.update(offerMessageRef, { status: 'approved' });
    await batch.commit();
    const newAppointmentData: Partial<Appointment> = { subject: jobPost.title, date: new Date().toISOString().split('T')[0], time: '09:00', status: 'pending-confirmation', locationType: jobPost.jobType === 'Virtual' ? 'virtual' : 'physical', address: jobPost.location, notes: `This appointment was created from your successful application... Please confirm or update the date and time.`, };
    await addAppointment(offerMessage.recipientId, newAppointmentData);
    await sendAppMessage(offerMessage.recipientId, "Ten99 System", jobPost.userId, `Offer Accepted: ${jobPost.title}`, `${offerMessage.senderName} has accepted your offer for "${jobPost.title}". An event has been added to their calendar for confirmation.`);
};
export const declineJobOffer = async (offerMessage: Message): Promise<void> => {
    if (!offerMessage.id || !offerMessage.jobPostId || offerMessage.type !== 'offer') throw new Error("Invalid offer message.");
    const jobPostRef = doc(db, 'jobPostings', offerMessage.jobPostId);
    await updateDoc(jobPostRef, { pendingApplicantId: '' });
    const offerMessageRef = doc(db, 'users', offerMessage.recipientId, 'messages', offerMessage.id);
    await updateDoc(offerMessageRef, { status: 'declined' });
    await sendAppMessage(offerMessage.recipientId, "Ten99 System", offerMessage.senderId, `Offer Declined: ${offerMessage.subject.replace('Job Offer for: ', '')}`, `The applicant has declined your offer. The job post "${offerMessage.subject.replace('Job Offer for: ', '')}" has been made available for other applicants.`);
};
export const rescindJobOffer = async (applicationMessage: Message): Promise<void> => {
    if (!applicationMessage.id || !applicationMessage.jobPostId) return;
    const jobPostRef = doc(db, 'jobPostings', applicationMessage.jobPostId);
    await updateDoc(jobPostRef, { pendingApplicantId: '' });
    const originalMessageRef = doc(db, 'users', applicationMessage.recipientId, 'messages', applicationMessage.id);
    await updateDoc(originalMessageRef, { status: 'offer-rescinded' });
    await sendAppMessage(applicationMessage.recipientId, "Job Poster", applicationMessage.senderId, `Offer Rescinded for: ${applicationMessage.subject.replace('Application for: ', '')}`, `The job offer for "${applicationMessage.subject.replace('Application for: ', '')}" has been rescinded.`);
};
export const reportJobPost = async (postId: string): Promise<void> => {
    if (!postId) return;
    const jobRef = doc(db, 'jobPostings', postId);
    await updateDoc(jobRef, { reportCount: increment(1) });
};

// --- MAGIC MAILBOX ACTION FUNCTIONS ---
export const confirmInboundOffer = async (userId: string, message: Message): Promise<void> => {
    if (!message.id || !message.appointmentId) { throw new Error("Cannot confirm offer: The message is missing a linked appointment ID."); }
    const batch = writeBatch(db);
    const messageRef = doc(db, `users/${userId}/messages`, message.id);
    batch.update(messageRef, { status: 'approved' });
    const appointmentRef = doc(db, `users/${userId}/appointments`, message.appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    if (!appointmentSnap.exists()) { throw new Error("Could not find the linked appointment to confirm."); }
    batch.update(appointmentRef, { status: 'scheduled', subject: appointmentSnap.data().subject.replace('Pending: ', '') });
    await batch.commit();
};
export const acceptInboundOfferPending = async (userId: string, message: Message): Promise<void> => {
    if (!message.id) throw new Error("Message ID is missing.");
    const userProfileSnap = await getDoc(doc(db, `users/${userId}/profile`, 'mainProfile'));
    const userName = userProfileSnap.exists() ? userProfileSnap.data()?.name || "The Freelancer" : "The Freelancer";
    const templatesRef = collection(db, `users/${userId}/templates`);
    const q = query(templatesRef, where("type", "==", "pending"), limit(1));
    const templateSnapshot = await getDocs(q);
    if (templateSnapshot.empty) { console.warn("No 'pending' template found. Skipping email reply."); }
    else { const template = templateSnapshot.docs[0].data() as Template; await sendAppMessage(userId, userName, message.senderId, template.subject, template.body); }
    await updateDoc(doc(db, `users/${userId}/messages`, message.id), { status: 'pending' });
};
export const declineInboundOffer = async (userId: string, message: Message): Promise<void> => {
    if (!message.id) throw new Error("Message ID is missing.");
    const batch = writeBatch(db);
    const messageRef = doc(db, `users/${userId}/messages`, message.id);
    batch.update(messageRef, { status: 'declined' });
    if (message.appointmentId) {
        const appointmentRef = doc(db, `users/${userId}/appointments`, message.appointmentId);
        batch.update(appointmentRef, { status: 'canceled' });
    }
    const userProfileSnap = await getDoc(doc(db, `users/${userId}/profile`, 'mainProfile'));
    const userName = userProfileSnap.exists() ? userProfileSnap.data()?.name || "The Freelancer" : "The Freelancer";
    const templatesRef = collection(db, `users/${userId}/templates`);
    const q = query(templatesRef, where("type", "==", "decline"), limit(1));
    const templateSnapshot = await getDocs(q);
    if (!templateSnapshot.empty) { const template = templateSnapshot.docs[0].data() as Template; await sendAppMessage(userId, userName, message.senderId, template.subject, template.body); }
    else { console.warn("No 'decline' template found. Skipping email reply."); }
    await batch.commit();
};
export const markAsEducation = async (userId: string, message: Message): Promise<void> => {
    if (!message.id || !message.appointmentId) { throw new Error("Cannot process education event: The message is missing a linked appointment ID."); }
    const batch = writeBatch(db);
    const messageRef = doc(db, `users/${userId}/messages`, message.id);
    batch.update(messageRef, { status: 'archived-education' });
    const appointmentRef = doc(db, `users/${userId}/appointments`, message.appointmentId);
    batch.update(appointmentRef, { status: 'scheduled', eventType: 'education' });
    await batch.commit();
};
export const createEducationAppointmentFromMessage = async (userId: string, message: Message, appointmentData: Partial<Appointment>): Promise<void> => {
    if (!message.id) { throw new Error("Cannot create event: Message ID is missing."); }
    const batch = writeBatch(db);
    const newAppointmentRef = doc(collection(db, `users/${userId}/appointments`));
    batch.set(newAppointmentRef, { ...cleanupObject(appointmentData), createdAt: serverTimestamp() });
    const messageRef = doc(db, `users/${userId}/messages`, message.id);
    batch.update(messageRef, { status: 'archived-education', appointmentId: newAppointmentRef.id });
    await batch.commit();
};

// --- REMINDER & MILEAGE FUNCTIONS ---
export const addReminder = (userId: string, reminderData: Partial<Reminder>): Promise<DocumentReference> => {
    return addDoc(collection(db, `users/${userId}/reminders`), { ...cleanupObject(reminderData), createdAt: serverTimestamp() });
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