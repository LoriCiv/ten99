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
} from '@react-email/components';
import * as React from 'react';
import type { Invoice, Client, UserProfile } from '@/types/app-interfaces';

interface ReceiptEmailProps {
  invoice: Invoice;
  client: Client;
  user: UserProfile;
}

export const ReceiptEmail = ({ invoice, client, user }: ReceiptEmailProps) => {
    const previewText = `Receipt for Invoice #${invoice.invoiceNumber}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body>
                <Container>
                    <Section>
                        <h1>{user.professionalTitle || 'Your Company Name'}</h1>
                    </Section>
                    <h2>Receipt</h2>
                    <Text>
                        Thank you for your payment. This email is your official receipt for invoice #{invoice.invoiceNumber}, which was paid on {invoice.paymentDate}.
                    </Text>
                    <Hr />
                    <Section>
                        <Row>
                            <Column>
                                <p>BILLED TO</p>
                                <p><strong>{client.companyName || client.name}</strong></p>
                            </Column>
                            <Column style={{textAlign: 'right'}}>
                                <p>INVOICE #</p>
                                <p><strong>{invoice.invoiceNumber}</strong></p>
                                <p>DATE PAID</p>
                                <p><strong>{invoice.paymentDate}</strong></p>
                            </Column>
                        </Row>
                    </Section>
                    <Hr />
                    <Section>
                         <Row>
                            <Column><strong>ITEM</strong></Column>
                            <Column style={{textAlign: 'right'}}><strong>TOTAL</strong></Column>
                        </Row>
                        {invoice.lineItems.map((item, index) => (
                             <Row key={index}>
                                <Column>{item.description}</Column>
                                <Column style={{textAlign: 'right'}}>${item.total.toFixed(2)}</Column>
                            </Row>
                        ))}
                    </Section>
                    <Hr />
                    <Section>
                        <Row>
                            <Column style={{textAlign: 'right'}}>
                                <strong>Amount Paid</strong>
                            </Column>
                            <Column style={{textAlign: 'right'}}>
                                <strong>${invoice.total.toFixed(2)}</strong>
                            </Column>
                        </Row>
                    </Section>
                    <Hr />
                    <Text>
                        {user.professionalTitle}, {user.address}, {user.phone}
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ReceiptEmail;