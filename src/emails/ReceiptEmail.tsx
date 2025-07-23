// src/emails/ReceiptEmail.tsx
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

interface ReceiptEmailProps {
    invoice: Invoice;
    client: Client;
    user: UserProfile;
}

const baseUrl = 'https://www.ten99.app';

// ✅ ADDED 'default' KEYWORD HERE
export default function ReceiptEmail({ invoice, client, user }: ReceiptEmailProps) {
    const previewText = `Receipt for Invoice #${invoice.invoiceNumber}`;
    const total = invoice.total || 0;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={body}>
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
                        <Heading as="h2" style={h2}>Receipt</Heading>
                        <Text style={paragraph}>
                            Thank you for your payment. This is your official receipt for invoice #{invoice.invoiceNumber}.
                        </Text>
                    </Section>
                    
                    <Section style={contentSection}>
                        <Row>
                            <Column>
                                <Text style={label}>BILLED TO</Text>
                                <Text style={value}>{client.companyName || client.name}</Text>
                            </Column>
                            <Column style={{ textAlign: 'right' }}>
                                <Text style={label}>RECEIPT #</Text>
                                <Text style={value}>{invoice.invoiceNumber}</Text>
                                <Text style={label}>DATE PAID</Text>
                                <Text style={value}>{invoice.paymentDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    <Section style={contentSection}>
                        <Row>
                            <Column style={totalsLabel}><strong>Amount Paid</strong></Column>
                            <Column style={totalsValue}><strong>${total.toFixed(2)}</strong></Column>
                        </Row>
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
    margin: '0 auto', 
    padding: '20px 0 48px', 
    marginBottom: '64px', 
    border: '1px solid #eee', 
    borderRadius: '5px' 
};
const body = {
    ...main,
    backgroundImage: `url(${baseUrl}/logo.png)`,
    backgroundSize: '200px',
    backgroundPosition: 'bottom center',
    backgroundRepeat: 'no-repeat',
};
const contentSection = { padding: '0 40px' };
const h1 = { color: '#333', fontSize: '28px', margin: '0 0 10px 0' };
const h2 = { color: '#333', fontSize: '22px', margin: '20px 0' };
const headerInfo = { color: '#555', fontSize: '14px', lineHeight: '22px' };
const paragraph = { fontSize: '16px', lineHeight: '24px' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
const label = { color: '#888', fontSize: '12px', textTransform: 'uppercase' as const };
const value = { color: '#333', fontSize: '16px', fontWeight: 'bold' };
const footer = { padding: '20px 40px 0 40px', color: '#A9A9A9', fontSize: '12px' };
const footerText = { textAlign: 'right' as const, lineHeight: '1' };
const totalsLabel = { textAlign: 'left' as const, width: '75%', fontSize: '16px' };
const totalsValue = { textAlign: 'right' as const, width: '25%', fontSize: '16px' };