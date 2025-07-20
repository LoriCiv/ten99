// src/emails/ReceiptEmail.tsx
import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr } from '@react-email/components';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

interface ReceiptEmailProps {
  invoice: Invoice;
  client: Client;
  user: UserProfile;
}

export default function ReceiptEmail({ invoice, client, user }: ReceiptEmailProps) {
  const formatCurrency = (amount?: number) => `$${(amount || 0).toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>Receipt for Invoice #{invoice.invoiceNumber} - Thank You!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={h1}>Thank you for your payment!</Heading>
            <Text style={text}>Hi {client.name},</Text>
            <Text style={text}>This is a receipt for your recent payment on invoice #{invoice.invoiceNumber}. The full amount has been paid and your account is settled.</Text>
          </Section>
          <Hr style={hr} />
          <Section>
            <Text style={label}>Amount Paid</Text>
            <Text style={amountPaid}>{formatCurrency(invoice.total)}</Text>
            <Text style={label}>Date Paid</Text>
            <Text style={text}>{invoice.paymentDate || new Date().toISOString().split('T')[0]}</Text>
            <Text style={label}>Payment For</Text>
            <Text style={text}>Invoice #{invoice.invoiceNumber}</Text>
          </Section>
          <Hr style={hr} />
          <Section>
            <Text style={footerText}>
              Billed by {user.professionalTitle || 'Your Name'}. We appreciate your business!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- Inline Styles for Email ---
const main: React.CSSProperties = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', border: '1px solid #eaeaea', borderRadius: '4px' };
const h1: React.CSSProperties = { color: '#000', fontSize: '24px', fontWeight: 'normal', textAlign: 'center', margin: '30px 0' };
const text: React.CSSProperties = { color: '#000', fontSize: '14px', lineHeight: '24px', padding: '0 20px' };
const label: React.CSSProperties = { color: '#525252', fontSize: '12px', textTransform: 'uppercase', padding: '0 20px' };
const amountPaid: React.CSSProperties = { color: '#000', fontSize: '32px', fontWeight: 'bold', lineHeight: '24px', padding: '0 20px', marginBottom: '20px' };
const hr: React.CSSProperties = { borderColor: '#eaeaea', margin: '20px' };
const footerText: React.CSSProperties = { color: '#8898aa', fontSize: '12px', lineHeight: '16px', padding: '0 20px' };