import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';
import '@/lib/firebase-admin'; // ✅ Import to ensure admin app is initialized

export async function POST(request: Request) {
    try {
        const storage = getStorage(); // ✅ This works because admin is already initialized

        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: You must be logged in to upload files.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        const filePath = `userUploads/${userId}/${fileName}`;
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const fileUpload = bucket.file(filePath);

        await fileUpload.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });

        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-09-2491', // A very long expiration date for permanent-like access
        });

        return NextResponse.json({ fileUrl: url });

    } catch (error) {
        console.error('Upload API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: `Upload failed: ${errorMessage}` }, { status: 500 });
    }
}