// src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
// ✅ CORRECTED: This path now matches your actual file name.
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ten99',
  description: 'Freelancing Simplified',
  // Adds your logo as the browser tab icon
  icons: [{ rel: 'icon', url: '/logo.png' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          appearance={{
            // Customizes your sign-in page to use your logo
            layout: {
              socialButtonsVariant: 'iconButton',
              logoImageUrl: '/logo.png',
            },
            variables: {
              // Sets the primary color of Clerk components to black
              colorPrimary: '#000000',
            },
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}