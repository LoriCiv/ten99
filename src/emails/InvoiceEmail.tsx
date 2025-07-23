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
    Img,
} from '@react-email/components';
import * as React from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

export interface InvoiceEmailProps {
    invoice: Invoice;
    client: Client;
    user: UserProfile;
}

const baseUrl = 'https://www.ten99.app';

export default function InvoiceEmail({ invoice, client, user }: InvoiceEmailProps) {
    const previewText = `Invoice #${invoice.invoiceNumber} from ${user.name || user.professionalTitle || 'Your Business'}`;
    const subtotal = invoice.subtotal || 0;
    const tax = invoice.tax || 0;
    const total = invoice.total || 0;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}> {/* ✅ Use the simple 'main' style */}
                <Container style={container}>
                    <Section style={contentSection}>
                        {user.name && <Heading as="h1" style={h1}>{user.name}</Heading>}
                        {user.professionalTitle && <Text style={headerInfo}>{user.professionalTitle}</Text>}
                        {user.address && <Text style={headerInfo}>{user.address.replace(/\n/g, ', ')}</Text>}
                        <Text style={headerInfo}>
                            {user.phone && <span>{user.phone}</span>}
                            {user.phone && user.email && <span> | </span>}
                            {user.email && <span>{user.email}</span>}
                        </Text>
                    </Section>
                    
                    <Section style={contentSection}>
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

                    <Section style={contentSection}>
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

                    <Section style={contentSection}>
                         <Row>
                            <Column style={totalsLabel}>Subtotal</Column>
                            <Column style={totalsValue}>${subtotal.toFixed(2)}</Column>
                        </Row>
                         <Row>
                            <Column style={totalsLabel}>Tax</Column>
                            <Column style={totalsValue}>${tax.toFixed(2)}</Column>
                        </Row>
                        <Row>
                            <Column style={totalsLabel}><strong>Amount Due</strong></Column>
                            <Column style={totalsValue}><strong>${total.toFixed(2)}</strong></Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    <Section style={contentSection}>
                        <Text style={notesHeader}>Payment Details</Text>
                        <Text style={notesText}>{invoice.paymentDetails || user.defaultPaymentDetails || 'Payment details not provided.'}</Text>
                    </Section>
                    
                    <Hr style={hr} />
                    
                    <Section style={footer}>
                        <Row>
                            <Column align="left" style={{ width: '50%' }}>
                                <Img src={`${baseUrl}/logo.png`} width="70" alt="Ten99 Logo" />
                            </Column>
                            <Column align="right" style={{ width: '50%' }}>
                                <Text style={footerText}>Powered by TenFlow.app</Text>
                            </Column>
                        </Row>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// --- STYLES ---
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { 
    backgroundColor: '#ffffff', // ✅ Solid white background
    margin: '0 auto', 
    padding: '20px 0 48px', 
    marginBottom: '64px', 
    border: '1px solid #eee', 
    borderRadius: '5px' 
};
// ✅ REMOVED: The old 'body' style with the background image is gone.
const contentSection = { padding: '0 40px' };
const h1 = { color: '#333', fontSize: '28px', margin: '0 0 10px 0' };
const headerInfo = { color: '#555', fontSize: '14px', lineHeight: '22px' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
const label = { color: '#888', fontSize: '12px', textTransform: 'uppercase' as const };
const value = { color: '#333', fontSize: '16px', fontWeight: 'bold' };
const tableHeader = { color: '#888', fontSize: '12px' };
const tableRow = { paddingTop: '8px', paddingBottom: '8px' };
const notesHeader = { fontWeight: 'bold' as const, marginBottom: '8px' };
const notesText = { fontSize: '14px', color: '#555', whiteSpace: 'pre-line' as const };
const footer = { padding: '20px 40px 0 40px', color: '#A9A9A9', fontSize: '12px' };
const footerText = { textAlign: 'right' as const, lineHeight: '1' };
const totalsLabel = { textAlign: 'left' as const, width: '75%' };
const totalsValue = { textAlign: 'right' as const, width: '25%' };