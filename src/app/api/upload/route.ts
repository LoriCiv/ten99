// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin'; 
import { v4 as uuidv4 } from 'uuid';

const TEMP_USER_ID = "dev-user-1";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // ✅ THE FINAL FIX: We are now forcing the code to use the specific bucket name,
        // bypassing any and all configuration loading issues.
        const bucket = admin.storage().bucket("ten-99.firebasestorage.app");

        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `jobFiles/${TEMP_USER_ID}/${fileName}`;
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileUpload = bucket.file(filePath);

        await fileUpload.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });

        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-09-2491',
        });

        return NextResponse.json({ fileUrl: url });

    } catch (error) {
        console.error('Upload API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: `Upload failed: ${errorMessage}` }, { status: 500 });
    }
}