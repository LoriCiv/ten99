import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseProvider } from "@/components/FirebaseProvider"; // 1. Import the new provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ten99",
  description: "Your Freelance Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 2. Wrap your children with the FirebaseProvider here */}
            <FirebaseProvider>
              {children}
            </FirebaseProvider>
            
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}