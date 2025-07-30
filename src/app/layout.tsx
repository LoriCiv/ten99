// src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import './globals.css'; // This line imports your global styles

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Step 1: ClerkProvider must wrap everything, including the <html> tag,
    // so that authentication is available everywhere in your app.
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* Step 2: Our custom FirebaseProvider goes inside the body. 
              This ensures it runs after the main page structure is set up. */}
          <FirebaseProvider>
            {/* Step 3: {children} is the placeholder where Next.js will
                render all of your different pages. */}
            {children}
          </FirebaseProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}