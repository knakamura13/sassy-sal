import { json } from '@sveltejs/kit';
import {
    createSanityDocument,
    updateSanityDocument,
    deleteSanityDocument
} from '$lib/server/sanity';

export async function POST({ request }) {
    try {
        const { operation, data } = await request.json();

        // Require authentication for all operations
        // For a real app, you should add more sophisticated auth here

        // Handle different operations
        switch (operation) {
            case 'createCategory':
                const createdCategory = await createSanityDocument(data);
                return json({ success: true, data: createdCategory });

            case 'updateCategory':
                const { id, updates } = data;
                const updatedCategory = await updateSanityDocument(id, updates);
                return json({ success: true, data: updatedCategory });

            case 'deleteCategory':
                await deleteSanityDocument(data.id);
                return json({ success: true });

            case 'createImage':
                const createdImage = await createSanityDocument(data);
                return json({ success: true, data: createdImage });

            case 'updateImage':
                const { imageId, imageUpdates } = data;
                const updatedImage = await updateSanityDocument(imageId, imageUpdates);
                return json({ success: true, data: updatedImage });

            case 'deleteImage':
                await deleteSanityDocument(data.imageId);
                return json({ success: true });

            default:
                return json({ error: 'Invalid operation' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in Sanity API endpoint:', error);
        return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
} 