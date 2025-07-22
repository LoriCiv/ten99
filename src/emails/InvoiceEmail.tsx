// src/emails/InvoiceEmail.tsx
import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Row,
    Column,
    Heading,
} from '@react-email/components';
import * as React from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

export interface InvoiceEmailProps {
    invoice: Invoice;
    client: Client;
    user: UserProfile;
}

// Main component for the invoice email
export default function InvoiceEmail({ invoice, client, user }: InvoiceEmailProps) {
    const previewText = `Invoice #${invoice.invoiceNumber} from ${user.professionalTitle || user.name || 'Your Business'}`;

    // Safely calculate totals
    const subtotal = invoice.subtotal || 0;
    const tax = invoice.tax || 0;
    const total = invoice.total || 0;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading as="h1" style={h1}>{user.professionalTitle || user.name || 'Your Company Name'}</Heading>
                    </Section>
                    
                    <Section>
                        <Row>
                            <Column>
                                <Text style={label}>BILLED TO</Text>
                                <Text style={value}>{client.companyName || client.name}</Text>
                            </Column>
                            <Column style={{ textAlign: 'right' }}>
                                <Text style={label}>INVOICE #</Text>
                                <Text style={value}>{invoice.invoiceNumber}</Text>
                                <Text style={label}>DUE DATE</Text>
                                <Text style={value}>{invoice.dueDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    <Section>
                        <Row style={tableHeader}>
                            <Column><strong>ITEM</strong></Column>
                            <Column style={{ textAlign: 'right' }}><strong>TOTAL</strong></Column>
                        </Row>
                        {invoice.lineItems?.map((item, index) => (
                             <Row key={index} style={tableRow}>
                                <Column>{item.description}</Column>
                                <Column style={{ textAlign: 'right' }}>${(item.total || 0).toFixed(2)}</Column>
                            </Row>
                        ))}
                    </Section>

                    <Hr style={hr} />

                    <Section style={{ textAlign: 'right' }}>
                        <Row>
                            <Column>Subtotal</Column>
                            <Column style={{ textAlign: 'right' }}>${subtotal.toFixed(2)}</Column>
                        </Row>
                         <Row>
                            <Column>Tax</Column>
                            <Column style={{ textAlign: 'right' }}>${tax.toFixed(2)}</Column>
                        </Row>
                        <Row>
                            <Column><strong>Amount Due</strong></Column>
                            <Column style={{ textAlign: 'right' }}><strong>${total.toFixed(2)}</strong></Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    <Section>
                        <Text style={notesHeader}>Payment Details</Text>
                        <Text style={notesText}>{invoice.paymentDetails || user.defaultPaymentDetails || 'Payment details not provided.'}</Text>
                    </Section>
                    
                    <Hr style={hr} />

                    <Section style={{ textAlign: 'center', color: '#888' }}>
                        <Text>{user.name || ''} | {user.address || ''} | {user.phone || ''}</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// --- STYLES ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', border: '1px solid #eee', borderRadius: '5px' };
const header = { padding: '0 20px' };
const h1 = { color: '#333', fontSize: '24px' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
const label = { color: '#888', fontSize: '12px', textTransform: 'uppercase' as const };
const value = { color: '#333', fontSize: '16px', fontWeight: 'bold' };
const tableHeader = { padding: '0 20px', color: '#888', fontSize: '12px' };
const tableRow = { padding: '0 20px' };
const notesHeader = { fontWeight: 'bold' as const, marginBottom: '8px' };
const notesText = { fontSize: '14px', color: '#555', whiteSpace: 'pre-line' as const };