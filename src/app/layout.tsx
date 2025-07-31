// src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ten99',
  description: 'Freelancing Simplified',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className="bg-background text-foreground">
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
