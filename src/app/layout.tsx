// src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import './globals.css';

// It's good practice to define your app's metadata here
export const metadata = {
  title: 'Ten99',
  description: 'Freelancing Simplified',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We've removed the redirect props to keep this clean.
    // Redirects are better managed in the Clerk Dashboard.
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-background text-foreground">
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}