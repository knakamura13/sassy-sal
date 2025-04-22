import { json } from '@sveltejs/kit';
import { uploadSanityAsset } from '$lib/server/sanity';

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

        // Upload to Sanity
        const asset = await uploadSanityAsset('image', buffer, {
            filename: file.name,
            contentType: file.type
        });

        return json({ success: true, asset });
    } catch (error) {
        console.error('Error uploading file to Sanity:', error);
        return json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 