// src/utils/firestoreService.ts
import { db } from '@/lib/firebase';
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
    QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Client, PersonalNetworkContact, JobFile, Appointment, Message, Template, Certification, CEU, UserProfile, Invoice, Expense, JobPosting } from '@/types/app-interfaces';
import { v4 as uuidv4 } from 'uuid';

const cleanupObject = (data: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    for (const key in data) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            cleaned[key] = data[key];
        }
    }
    return cleaned;
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
    const q = query(collection(db, `users/${userId}/jobFiles`), orderBy('createdAt', 'desc'));
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
export const uploadFile = async (userId: string, file: File): Promise<string> => { if (!file) throw new Error("No file provided for upload."); const formData = new FormData(); formData.append('file', file); const response = await fetch('/api/upload', { method: 'POST', body: formData }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'File upload failed.'); } const { fileUrl } = await response.json(); return fileUrl; };

export const addAppointment = async (userId: string, appointmentData: Partial<Appointment>, recurrenceEndDate?: string): Promise<void> => {
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
        await addDoc(collection(db, `users/${userId}/appointments`), dataToSave);
    }
};
export const updateAppointment = (userId: string, appointmentId: string, appointmentData: Partial<Appointment>): Promise<void> => { const appointmentRef = doc(db, `users/${userId}/appointments`, appointmentId); return updateDoc(appointmentRef, cleanupObject(appointmentData)); };
export const deleteAppointment = (userId: string, appointmentId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/appointments`, appointmentId)); };
export const updateMessage = (userId: string, messageId: string, messageData: Partial<Message>): Promise<void> => { const messageRef = doc(db, 'users', userId, 'messages', messageId); return updateDoc(messageRef, cleanupObject(messageData)); };
const findUserByEmail = async (email: string): Promise<{id: string, data: Record<string, any>} | null> => { const usersRef = collection(db, 'users'); const q = query(usersRef, where("email", "==", email)); const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { return { id: querySnapshot.docs[0].id, data: querySnapshot.docs[0].data() }; } return null; };
export const sendAppMessage = async (senderId: string, senderName: string, recipientEmail: string, subject: string, body: string): Promise<void> => { const recipient = await findUserByEmail(recipientEmail); const sentMessageData: Partial<Message> = { senderId, senderName, recipientId: recipient ? recipient.id : recipientEmail, subject, body, isRead: true, status: 'new', createdAt: serverTimestamp() as Timestamp, }; await addDoc(collection(db, `users/${senderId}/messages`), sentMessageData); if (recipient) { const receivedMessageData: Partial<Message> = { ...sentMessageData, isRead: false, }; await addDoc(collection(db, `users/${recipient.id}/messages`), receivedMessageData); } else { await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromName: senderName, to: recipientEmail, subject, html: `<p>${body.replace(/\n/g, '<br>')}</p><p>Sent by ${senderName} via the Ten99 App.</p>` }), }); } };
export const createPublicJobFile = async (userId: string, jobFile: JobFile): Promise<string> => { if (!jobFile.id) throw new Error("Cannot share an unsaved job file."); const publicData = { originalUserId: userId, originalJobFileId: jobFile.id, jobTitle: jobFile.jobTitle, clientId: jobFile.clientId || '', sharedNotes: jobFile.sharedNotes || '', fileUrl: jobFile.fileUrl || '', createdAt: serverTimestamp(), }; const publicDocRef = await addDoc(collection(db, "publicJobFiles"), publicData); return publicDocRef.id; };
export const getPublicJobFile = async (publicId: string): Promise<JobFile | null> => { const docRef = doc(db, "publicJobFiles", publicId); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as JobFile : null; };
export const getClientForJobFile = async (userId: string, clientId: string): Promise<Client | null> => { const docRef = doc(db, 'users', userId, 'clients', clientId); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Client : null; };
export const getTemplates = (userId: string, callback: (data: Template[]) => void) => { const q = query(collection(db, `users/${userId}/templates`), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template))); }); };
export const addTemplate = (userId: string, templateData: Partial<Template>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/templates`), { ...cleanupObject(templateData), createdAt: serverTimestamp() }); };
export const updateTemplate = (userId: string, templateId: string, templateData: Partial<Template>): Promise<void> => { const docRef = doc(db, `users/${userId}/templates`, templateId); return setDoc(docRef, cleanupObject(templateData), { merge: true }); };
export const deleteTemplate = (userId: string, templateId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/templates`, templateId)); };
export const ensureDefaultTemplates = async (userId: string): Promise<void> => { const templatesRef = collection(db, `users/${userId}/templates`); const q = query(templatesRef, limit(1)); const snapshot = await getDocs(q); if (snapshot.empty) { const batch = writeBatch(db); const declineTemplate: Omit<Template, 'id'> = { userId, name: "Polite Decline", subject: "Regarding the assignment", body: "Thank you so much for the consideration. Unfortunately, I am unavailable for this assignment. Please keep me in mind for future opportunities.", type: 'decline', createdAt: serverTimestamp() as Timestamp }; const declineRef = doc(collection(db, `users/${userId}/templates`)); batch.set(declineRef, declineTemplate); const acceptTemplate: Omit<Template, 'id'> = { userId, name: "Accept (Pending Confirmation)", subject: "Re: Your request", body: "Thank you for thinking of me for this opportunity. I am available and would be happy to do it. Please send over the final confirmation when you are ready.", type: 'pending', createdAt: serverTimestamp() as Timestamp }; const acceptRef = doc(collection(db, `users/${userId}/templates`)); batch.set(acceptRef, acceptTemplate); await batch.commit(); } };
export const approveMessageAndCreateAppointment = async (userId: string, message: Message): Promise<void> => { const parseWithAI = async (text: string, currentUserId: string): Promise<Partial<Appointment>> => { const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; if (!apiKey) throw new Error("Gemini API key is not configured."); const clientsSnapshot = await getDocs(collection(db, `users/${currentUserId}/clients`)); const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Client })); const prompt = `You are a highly intelligent scheduling assistant... CLIENTS: ${JSON.stringify(clients.map(c => ({id: c.id, name: c.companyName || c.name})))} TEXT: ${text}`; const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] }; const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(`AI API request failed: ${response.status}`); const result = await response.json(); const rawText = result.candidates[0].content.parts[0].text; const cleanText = rawText.replace(/```json\n/g, '').replace(/\n```/g, ''); const jsonStart = cleanText.indexOf('{'); const jsonEnd = cleanText.lastIndexOf('}'); if (jsonStart === -1 || jsonEnd === -1) throw new Error("No valid JSON object found in AI response."); return JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1)); }; if (!message.id) throw new Error("Message ID is missing."); const parsedData = await parseWithAI(message.body, userId); if (!parsedData.date || !parsedData.time) { throw new Error("AI could not determine a date and time from the message."); } const newStart = new Date(`${parsedData.date}T${parsedData.time}`); const newEnd = parsedData.endTime ? new Date(`${parsedData.date}T${parsedData.endTime}`) : new Date(newStart.getTime() + 60 * 60 * 1000); const appointmentsSnapshot = await getDocs(query(collection(db, `users/${userId}/appointments`), where('date', '==', parsedData.date))); const appointmentsForDay = appointmentsSnapshot.docs.map(doc => doc.data() as Appointment); const conflict = appointmentsForDay.find(existing => { if (!existing.time) return false; const existStart = new Date(`${existing.date}T${existing.time}`); const existEnd = existing.endTime ? new Date(`${existing.date}T${existing.endTime}`) : new Date(existStart.getTime() + 60 * 60 * 1000); return newStart < existEnd && newEnd > existStart; }); if (conflict) { throw new Error(`Scheduling conflict detected with: "${conflict.subject}" at ${conflict.time}.`); } const newAppointmentData: Omit<Appointment, 'id'> = { userId, eventType: 'job', subject: parsedData.subject || message.subject, status: 'scheduled', date: parsedData.date, time: parsedData.time, endTime: parsedData.endTime, clientId: parsedData.clientId, locationType: parsedData.locationType, address: parsedData.address, jobNumber: parsedData.jobNumber, notes: `Booked from message. Original sender: ${message.senderName} <${message.senderId}>\n\n--- ORIGINAL MESSAGE ---\n${message.body}`, createdAt: serverTimestamp() as Timestamp, }; const appointmentRef = await addDoc(collection(db, `users/${userId}/appointments`), newAppointmentData); const messageRef = doc(db, `users/${userId}/messages`, message.id); await updateDoc(messageRef, { status: 'approved', appointmentId: appointmentRef.id }); };
export const getCertifications = (userId: string, callback: (data: Certification[]) => void) => { const q = query(collection(db, `users/${userId}/certifications`), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certification))); }); };
export const addCertification = (userId: string, certData: Partial<Certification>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/certifications`), { ...cleanupObject(certData), createdAt: serverTimestamp() }); };
export const updateCertification = (userId: string, certId: string, certData: Partial<Certification>): Promise<void> => { const docRef = doc(db, `users/${userId}/certifications`, certId); return setDoc(docRef, cleanupObject(certData), { merge: true }); };
export const deleteCertification = async (userId: string, certId: string): Promise<void> => { const batch = writeBatch(db); const certRef = doc(db, `users/${userId}/certifications`, certId); const ceusRef = collection(db, `users/${userId}/certifications/${certId}/ceus`); const ceusSnapshot = await getDocs(ceusRef); ceusSnapshot.forEach(doc => batch.delete(doc.ref)); batch.delete(certRef); await batch.commit(); };
export const getCEUsForCertification = (userId: string, certId: string, callback: (data: CEU[]) => void) => { const q = query(collection(db, `users/${userId}/certifications/${certId}/ceus`), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CEU))); }); };
export const addCEU = (userId: string, certId: string, ceuData: Partial<CEU>): Promise<DocumentReference> => { const dataToSave = { ...cleanupObject(ceuData), certificationId: certId, createdAt: serverTimestamp() }; return addDoc(collection(db, `users/${userId}/certifications/${certId}/ceus`), dataToSave); };
export const deleteCEU = (userId: string, certId: string, ceuId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/certifications/${certId}/ceus`, ceuId)); };
export const updateCEU = (userId: string, certId: string, ceuId: string, ceuData: Partial<CEU>): Promise<void> => { const docRef = doc(db, `users/${userId}/certifications/${certId}/ceus`, ceuId); return setDoc(docRef, cleanupObject(ceuData), { merge: true }); };
export const getUserProfile = (userId: string, callback: (data: UserProfile | null) => void) => { const docRef = doc(db, `users/${userId}/profile`, 'mainProfile'); return onSnapshot(docRef, (docSnap) => { if (docSnap.exists()) { callback({ id: docSnap.id, ...docSnap.data() } as UserProfile); } else { callback({ isVirtual: false, skills: [], languages: [], jobHistory: [], education: [] }); } }); };
export const updateUserProfile = (userId: string, profileData: Partial<UserProfile>): Promise<void> => { const docRef = doc(db, `users/${userId}/profile`, 'mainProfile'); return setDoc(docRef, cleanupObject(profileData), { merge: true }); };
export const getInvoices = (userId: string, callback: (data: Invoice[]) => void) => { const q = query(collection(db, `users/${userId}/invoices`), orderBy('invoiceDate', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))); }); };
const generateNextInvoiceNumber = async (userId: string): Promise<string> => { const metaRef = doc(db, `users/${userId}/_metadata`, 'invoiceCounter'); const year = new Date().getFullYear(); try { const newInvoiceNumber = await runTransaction(db, async (transaction) => { const metaDoc = await transaction.get(metaRef); if (!metaDoc.exists()) { transaction.set(metaRef, { lastNumber: 1, year: year }); return `${year}-001`; } const data = metaDoc.data(); const lastNumber = data.year === year ? data.lastNumber : 0; const nextNumber = lastNumber + 1; transaction.update(metaRef, { lastNumber: nextNumber, year: year }); return `${year}-${String(nextNumber).padStart(3, '0')}`; }); return newInvoiceNumber; } catch (error) { console.error("Transaction failed: ", error); return `${year}-${Date.now().toString().slice(-5)}`; } };
export const addInvoice = async (userId: string, invoiceData: Partial<Invoice>): Promise<void> => { if (!invoiceData.invoiceNumber) { invoiceData.invoiceNumber = await generateNextInvoiceNumber(userId); } const dataToSave = { ...cleanupObject(invoiceData), createdAt: serverTimestamp(), }; await addDoc(collection(db, `users/${userId}/invoices`), dataToSave); };
export const updateInvoice = (userId: string, invoiceId: string, invoiceData: Partial<Invoice>): Promise<void> => { const docRef = doc(db, `users/${userId}/invoices`, invoiceId); return setDoc(docRef, cleanupObject(invoiceData), { merge: true }); };
export const deleteInvoice = (userId: string, invoiceId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/invoices`, invoiceId)); };
const calculateDurationInHours = (startTime?: string, endTime?: string): number => { if (!startTime || !endTime) return 1; const start = new Date(`1970-01-01T${startTime}`); const end = new Date(`1970-01-01T${endTime}`); const diffMs = end.getTime() - start.getTime(); if (diffMs <= 0) return 1; return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); };
export const createInvoiceFromAppointment = async (userId: string, appointment: Appointment): Promise<void> => { if (!appointment.clientId || !appointment.id) throw new Error("Appointment must have an ID and be linked to a client."); const clientRef = doc(db, `users/${userId}/clients`, appointment.clientId); const clientSnap = await getDoc(clientRef); if (!clientSnap.exists()) throw new Error("Client not found for this appointment."); const client = clientSnap.data() as Client; const rate = client.rate || 0; const duration = calculateDurationInHours(appointment.time, appointment.endTime); const description = `${appointment.subject || 'Services Rendered'}\nDate: ${appointment.date}`; const invoiceData: Partial<Invoice> = { clientId: appointment.clientId, appointmentId: appointment.id, invoiceDate: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'draft', lineItems: [{ description, quantity: duration, unitPrice: rate, total: duration * rate }], subtotal: duration * rate, total: duration * rate, }; await addInvoice(userId, invoiceData); };
export const getExpenses = (userId: string, callback: (data: Expense[]) => void) => { const q = query(collection(db, `users/${userId}/expenses`), orderBy('date', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))); }); };
export const addExpense = (userId: string, expenseData: Partial<Expense>): Promise<DocumentReference> => { return addDoc(collection(db, `users/${userId}/expenses`), { ...cleanupObject(expenseData), createdAt: serverTimestamp() }); };
export const updateExpense = (userId: string, expenseId: string, expenseData: Partial<Expense>): Promise<void> => { return setDoc(doc(db, `users/${userId}/expenses`, expenseId), cleanupObject(expenseData), { merge: true }); };
export const deleteExpense = (userId: string, expenseId: string): Promise<void> => { return deleteDoc(doc(db, `users/${userId}/expenses`, expenseId)); };
export const getJobPostings = (callback: (data: JobPosting[]) => void) => { const q = query(collection(db, 'jobPostings'), where('isFilled', '==', false), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosting))); }); };
export const addJobPosting = (userId: string, jobData: Partial<JobPosting>): Promise<DocumentReference> => { return addDoc(collection(db, 'jobPostings'), { ...cleanupObject(jobData), userId, isFilled: false, createdAt: serverTimestamp() }); };