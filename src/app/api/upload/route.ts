// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin'; // ✅ FIX: Use the named 'storage' import
import { v4 as uuidv4 } from 'uuid';

const TEMP_USER_ID = "dev-user-1";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
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