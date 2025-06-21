import { json } from '@sveltejs/kit';
import { uploadSanityAsset } from '$lib/server/sanityServerClient';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return json({ error: 'No valid file provided' }, { status: 400 });
        }

        // Convert the File object to Buffer for Sanity
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Sanity with timeout handling
        const uploadPromise = uploadSanityAsset('image', buffer, {
            filename: file.name,
            contentType: file.type
        });

        // Add a timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000);
        });

        const asset = await Promise.race([uploadPromise, timeoutPromise]);

        return json({ success: true, asset });
    } catch (error) {
        console.error('Error uploading file to Sanity:', error);

        // Provide more specific error messages
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
            if (error.message.includes('timeout')) {
                errorMessage = 'Upload timed out. Please check your connection and try again.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error during upload. Please check your connection and try again.';
            }
        }

        return json(
            {
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
