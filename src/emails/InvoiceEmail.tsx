// src/emails/InvoiceEmail.tsx
import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Row, Column } from '@react-email/components';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

interface InvoiceEmailProps {
  invoice: Invoice;
  client: Client;
  user: UserProfile;
}

export default function InvoiceEmail({ invoice, client, user }: InvoiceEmailProps) {
  const formatCurrency = (amount?: number) => `$${(amount || 0).toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>Invoice #{invoice.invoiceNumber} from {user.professionalTitle || 'Your Name'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column>
                <Heading style={h1}>INVOICE</Heading>
              </Column>
              <Column style={headerInfo}>
                <Text style={headerTitle}>{user.professionalTitle || 'Your Name'}</Text>
                <Text style={headerText}>{user.address || ''}</Text>
                <Text style={headerText}>{user.phone || ''}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={metaInfo}>
            <Row>
              <Column style={{ width: '50%' }}>
                <Text style={label}>BILL TO</Text>
                <Text style={text}>{client.companyName || client.name}</Text>
                {client.address && <Text style={text}>{client.address}</Text>}
              </Column>
              <Column style={{ width: '50%', textAlign: 'right' }}>
                <Text style={label}>INVOICE #</Text>
                <Text style={text}>{invoice.invoiceNumber}</Text>
                <Text style={label}>INVOICE DATE</Text>
                <Text style={text}>{invoice.invoiceDate}</Text>
                <Text style={label}>DUE DATE</Text>
                <Text style={text}>{invoice.dueDate}</Text>
              </Column>
            </Row>
          </Section>

          <Section>
            <Row style={tableHeader}>
              <Column style={{ ...tableCell, width: '50%' }}>DESCRIPTION</Column>
              <Column style={{ ...tableCell, textAlign: 'center' }}>QTY</Column>
              <Column style={{ ...tableCell, textAlign: 'right' }}>RATE</Column>
              <Column style={{ ...tableCell, textAlign: 'right' }}>AMOUNT</Column>
            </Row>
            {invoice.lineItems.map((item, index) => (
              <Row key={index} style={tableRow}>
                <Column style={{ ...tableCell, width: '50%', whiteSpace: 'pre-line' }}>{item.description}</Column>
                <Column style={{ ...tableCell, textAlign: 'center' }}>{item.quantity}</Column>
                <Column style={{ ...tableCell, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</Column>
                <Column style={{ ...tableCell, textAlign: 'right' }}>{formatCurrency(item.total)}</Column>
              </Row>
            ))}
          </Section>

          <Section style={{ marginTop: '20px' }}>
            <Row>
              <Column style={{ width: '60%' }}></Column>
              <Column style={{ width: '40%' }}>
                <Row>
                  <Column style={totalsLabel}>Subtotal</Column>
                  <Column style={totalsValue}>{formatCurrency(invoice.subtotal)}</Column>
                </Row>
                <Row>
                  <Column style={totalsLabel}>Tax</Column>
                  <Column style={totalsValue}>{formatCurrency(invoice.tax)}</Column>
                </Row>
                <Hr style={hr} />
                <Row>
                  <Column style={totalsLabelBold}>Amount Due</Column>
                  <Column style={totalsValueBold}>{formatCurrency(invoice.total)}</Column>
                </Row>
              </Column>
            </Row>
          </Section>

          {(invoice.notes || invoice.paymentDetails) && <Hr style={hr} />}

          {invoice.notes && (
            <Section>
              <Text style={label}>Notes</Text>
              <Text style={text}>{invoice.notes}</Text>
            </Section>
          )}

          {invoice.paymentDetails && (
            <Section>
              <Text style={label}>Payment Details</Text>
              <Text style={text}>{invoice.paymentDetails}</Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}

// --- Inline Styles for Email ---
const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: 'sans-serif' };
const container: React.CSSProperties = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
const header: React.CSSProperties = { paddingBottom: '20px' };
const h1: React.CSSProperties = { fontSize: '32px', fontWeight: 'bold', margin: '0' };
const headerInfo: React.CSSProperties = { textAlign: 'right' };
const headerTitle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', margin: '0' };
const headerText: React.CSSProperties = { color: '#525252', fontSize: '14px', margin: '0' };
const metaInfo: React.CSSProperties = { paddingTop: '20px', paddingBottom: '20px' };
const label: React.CSSProperties = { color: '#525252', fontSize: '12px', textTransform: 'uppercase' };
const text: React.CSSProperties = { fontSize: '14px', margin: '0 0 5px 0' };
const tableHeader: React.CSSProperties = { borderBottom: '1px solid #eaeaea', color: '#525252', textTransform: 'uppercase', fontSize: '12px' };
const tableRow: React.CSSProperties = { borderBottom: '1px solid #eaeaea' };
const tableCell: React.CSSProperties = { padding: '10px 0' };
const hr: React.CSSProperties = { borderColor: '#eaeaea', margin: '20px 0' };
const totalsLabel: React.CSSProperties = { width: '60%', color: '#525252', textAlign: 'right' };
const totalsValue: React.CSSProperties = { width: '40%', textAlign: 'right' };
const totalsLabelBold: React.CSSProperties = { width: '60%', fontWeight: 'bold', textAlign: 'right' };
const totalsValueBold: React.CSSProperties = { width: '40%', fontWeight: 'bold', textAlign: 'right' };