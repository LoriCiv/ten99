import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Ten99',
  description: 'Freelancing Simplified',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}