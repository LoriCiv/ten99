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

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default function ReceiptEmail({ invoice, client, user }: ReceiptEmailProps) {
    const previewText = `Receipt for Invoice #${invoice.invoiceNumber}`;
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
                        <Heading as="h2" className="text-xl font-semibold m-0">Receipt</Heading>
                        <Text className="text-base leading-6">
                            Thank you for your payment. This is your official receipt for invoice #{invoice.invoiceNumber}.
                        </Text>
                    </Section>
                    
                    <Section className="py-4">
                        <Row>
                            <Column>
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0">BILLED TO</Text>
                                <Text className="text-base font-medium m-0">{client.companyName || client.name}</Text>
                            </Column>
                            <Column className="text-right">
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0">RECEIPT #</Text>
                                <Text className="text-base font-medium m-0">{invoice.invoiceNumber}</Text>
                                <Text className="text-xs uppercase text-gray-500 font-bold m-0 mt-2">DATE PAID</Text>
                                <Text className="text-base font-medium m-0">{invoice.paymentDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr className="border-gray-300 my-4" />

                    <Section>
                        <Row>
                            <Column className="w-3/4">
                                <Text className="text-base font-bold m-0">Amount Paid</Text>
                            </Column>
                            <Column className="w-1/4 text-right">
                                <Text className="text-base font-bold m-0">${total.toFixed(2)}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr className="border-gray-300 my-4" />
                    
                    <Section className="pt-4">
                        <Row>
                            <Column className="w-1/2">
                                {/* You might need to host your logo image online for it to appear in emails */}
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
