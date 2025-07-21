// src/emails/InvoiceEmail.tsx
import {
  Body, Container, Head, Hr, Html, Preview, Section, Text, Row, Column,
} from '@react-email/components';
import * as React from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

export interface InvoiceEmailProps {
  invoice: Invoice;
  client: Client;
  user: UserProfile;
}

export default function InvoiceEmail({ invoice, client, user }: InvoiceEmailProps) {
    const previewText = `Invoice #${invoice.invoiceNumber} from ${user.professionalTitle || 'Your Business'}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body>
                <Container>
                    <Section><h1>{user.professionalTitle || 'Your Company Name'}</h1></Section>
                    <h2>INVOICE</h2>
                    <Hr />
                    <Section>
                        <Row>
                            <Column><p>BILLED TO</p><p><strong>{client.companyName || client.name}</strong></p></Column>
                            <Column style={{textAlign: 'right'}}><p>INVOICE #</p><p><strong>{invoice.invoiceNumber}</strong></p><p>DUE DATE</p><p><strong>{invoice.dueDate}</strong></p></Column>
                        </Row>
                    </Section>
                    <Hr />
                    <Section>
                         <Row><Column><strong>ITEM</strong></Column><Column style={{textAlign: 'right'}}><strong>TOTAL</strong></Column></Row>
                        {invoice.lineItems.map((item, index) => (
                             <Row key={index}><Column>{item.description}</Column><Column style={{textAlign: 'right'}}>${item.total.toFixed(2)}</Column></Row>
                        ))}
                    </Section>
                    <Hr />
                    <Section>
                        <Row><Column style={{textAlign: 'right'}}><strong>Amount Due</strong></Column><Column style={{textAlign: 'right'}}><strong>${invoice.total.toFixed(2)}</strong></Column></Row>
                    </Section>
                    <Hr />
                    <Text>Please find the payment details below.</Text>
                    <Text>{invoice.paymentDetails || user.defaultPaymentDetails}</Text>
                    <Hr />
                    <Text>{user.professionalTitle}, {user.address}, {user.phone}</Text>
                </Container>
            </Body>
        </Html>
    );
};