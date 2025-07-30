// src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en">
        {/* THE FIX: Apply base styles here with Tailwind classes */}
        <body className="bg-background text-foreground">
          <FirebaseProvider>
            {children}
          </FirebaseProvider> 
        </body>
      </html>
    </ClerkProvider>
  );
}