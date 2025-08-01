// src/app/dashboard/test-email/page.tsx
"use client";

import { useAuth } from "@clerk/nextjs";

export default function TestEmailPage() {
    const { userId } = useAuth();

    const handleTestSend = async () => {
        if (!userId) {
            alert("Error: Clerk User ID not found. You might be signed out.");
            return;
        }

        console.log("--- TEST PAGE: Button clicked. Attempting fetch... ---");
        alert(`Attempting to send a test email as user: ${userId}. Click OK and check the console.`);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({
                    userId: userId,
                    to: ['Lacivello@gmail.com'], // Using the email from your previous screenshot
                    subject: 'Direct API Test from /test-email page',
                    html: '<p>This is a test from the new debug page. If you got this, it worked.</p>',
                    replyToEmail: 'noreply@ten99.app'
                }),
            });

            const responseData = await response.json();
            console.log("--- TEST PAGE: Response JSON ---", responseData);

            if (response.ok) {
                alert(`SUCCESS! The API call worked. The server says: ${responseData.message}`);
            } else {
                alert(`ERROR: The server responded with an error. The server says: ${responseData.error}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            alert(`FATAL ERROR: The fetch call itself failed. Check the console. Error: ${errorMessage}`);
            console.error("Fetch failed:", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Email API Test Page</h1>
            <p className="mb-4 text-muted-foreground">This page bypasses all other components to test the API route directly.</p>
            <button
                onClick={handleTestSend}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700"
            >
                Click Here to Send Test Email
            </button>
            <p className="mt-8 text-sm text-muted-foreground">
                After clicking the button, a series of pop-up alerts will appear. Follow their instructions.
            </p>
        </div>
    );
}