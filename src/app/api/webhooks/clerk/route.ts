// src/app/api/webhooks/clerk/route.ts

import { Webhook } from 'svix';
// No longer need to import headers from next/headers
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  // Get the secret from your Vercel Environment Variables
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from the Clerk Dashboard to your .env or .env.local file');
  }

  // ✅ THE FIX: Get headers directly from the request object
  const headerPayload = req.headers;
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Get the event type
  const eventType = evt.type;

  // Handle the "user.created" event
  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;

    if (!id || !email_addresses || email_addresses.length === 0) {
        return NextResponse.json({ error: 'Missing user ID or email address from webhook' }, { status: 400 });
    }
    
    // Create the new user profile document in your Firestore database
    try {
        await adminDb.collection('users').doc(id).set({
            userId: id,
            email: email_addresses[0].email_address,
            name: '', // The user will fill this in during onboarding
            createdAt: new Date(),
            isProfileComplete: false, // This is our new onboarding flag
        });
        console.log(`✅ Webhook success: Created user profile in Firestore for user: ${id}`);
    } catch (error) {
        console.error('🔥 Error creating user in Firestore via webhook:', error);
        return NextResponse.json({ error: 'Failed to create user in Firestore' }, { status: 500 });
    }
  }

  // Return a 200 response to Clerk to acknowledge receipt of the event
  return new Response('', { status: 200 });
}