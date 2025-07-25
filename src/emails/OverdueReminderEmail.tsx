import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
  Preview,
} from '@react-email/components';
import * as React from 'react';

interface OverdueReminderEmailProps {
  clientName?: string;
  invoiceNumber?: string;
  dueDate?: string;
  total?: number;
  userName?: string;
}

export const OverdueReminderEmail = ({
  clientName = "Valued Client",
  invoiceNumber = "[Invoice Number]",
  dueDate = "[Due Date]",
  total = 0,
  userName = "Your Business",
}: OverdueReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Invoice Reminder: Invoice #{invoiceNumber} is overdue.</Preview>
    <Body className="bg-gray-100 font-sans">
      <Container className="bg-white mx-auto p-10 border rounded-lg max-w-2xl">
        <Heading className="text-2xl font-bold">Payment Reminder</Heading>
        <Text className="text-base">Hi {clientName},</Text>
        <Text className="text-base">
          This is a friendly reminder that invoice #{invoiceNumber} for the amount of <strong>${total.toFixed(2)}</strong> was due on {dueDate} and is now overdue.
        </Text>
        <Text className="text-base">
          Thank you,<br />
          {userName}
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OverdueReminderEmail;