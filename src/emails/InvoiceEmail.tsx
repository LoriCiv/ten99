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

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default function InvoiceEmail({ invoice, client, user }: InvoiceEmailProps) {
    const previewText = `Invoice #${invoice.invoiceNumber} from ${user.name || user.professionalTitle || 'Your Business'}`;
    const subtotal = invoice.subtotal || 0;
    const tax = invoice.tax || 0;
    const total = invoice.total || 0;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body className="bg-gray-100 font-sans">
                <Container className="bg-white mx-auto my-16 p-10 border rounded-lg max-w-2xl">
                    <Section className="pb-4 border-b">
                        {user.name && <Heading as="h1" className="text-2xl font-bold m-0">{user.name}</Heading>}
                        {user.professionalTitle && <Text className="text-gray-600 text-sm m-0 mt-1">{user.professionalTitle}</Text>}
                        {user.address && <Text className="text-gray-600 text-sm m-0">{user.address.replace(/\n/g, ', ')}</Text>}
                        <Text className="text-gray-600 text-sm m-0">
                            {user.phone && <span>{user.phone}</span>}
                            {user.phone && user.email && <span> | </span>}
                            {user.email && <span>{user.email}</span>}
                        </Text>
                    </Section>
                    
                    <Section className="py-6">
                        <Row>
                            <Column>
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0">BILLED TO</Text>
                                <Text className="text-base font-medium m-0">{client.companyName || client.name}</Text>
                            </Column>
                            <Column className="text-right">
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0">INVOICE #</Text>
                                <Text className="text-base font-medium m-0">{invoice.invoiceNumber}</Text>
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0 mt-2">DUE DATE</Text>
                                <Text className="text-base font-medium m-0">{invoice.dueDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr className="border-gray-300 my-4" />

                    <Section>
                        <Row className="text-gray-500 text-xs font-bold uppercase">
                            <Column>Item</Column>
                            <Column className="text-right">Total</Column>
                        </Row>
                        {invoice.lineItems?.map((item, index) => (
                             <Row key={index} className="py-2 border-b border-gray-200">
                                 <Column>{item.description}</Column>
                                 <Column className="text-right">${(item.total || 0).toFixed(2)}</Column>
                             </Row>
                        ))}
                    </Section>

                    <Hr className="border-gray-300 my-4" />

                    <Section>
                         <Row>
                            <Column className="w-3/4 text-right"><Text className="m-0">Subtotal</Text></Column>
                            <Column className="w-1/4 text-right"><Text className="m-0">${subtotal.toFixed(2)}</Text></Column>
                        </Row>
                         <Row>
                            <Column className="w-3/4 text-right"><Text className="m-0">Tax</Text></Column>
                            <Column className="w-1/4 text-right"><Text className="m-0">${tax.toFixed(2)}</Text></Column>
                        </Row>
                         <Row>
                            <Column className="w-3/4 text-right"><Text className="m-0 font-bold">Amount Due</Text></Column>
                            <Column className="w-1/4 text-right"><Text className="m-0 font-bold">${total.toFixed(2)}</Text></Column>
                        </Row>
                    </Section>

                    <Hr className="border-gray-300 my-4" />

                    <Section>
                        <Text className="font-bold mb-2">Payment Details</Text>
                        <Text className="text-sm text-gray-600 whitespace-pre-line">
                            {invoice.paymentDetails || user.defaultPaymentDetails || 'Payment details not provided.'}
                        </Text>
                    </Section>
                    
                    <Hr className="border-gray-300 my-4" />
                    
                    <Section className="pt-4">
                        <Row>
                            <Column className="w-1/2">
                                <Img src={`${baseUrl}/logo.png`} width="70" alt="Ten99 Logo" />
                            </Column>
                            <Column className="w-1/2 text-right">
                                <Text className="text-xs text-gray-500">Powered by Ten99</Text>
                            </Column>
                        </Row>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};
