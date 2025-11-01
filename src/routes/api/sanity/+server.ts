import { json } from '@sveltejs/kit';
import { createSanityDocument, updateSanityDocument, deleteSanityDocument, serverClient } from '$lib/server/sanityServerClient';

export async function POST({ request, cookies }) {
    try {
        const { operation, data } = await request.json();

        // Require authentication for all operations
        const adminSession = cookies.get('admin_session');
        if (!adminSession || adminSession !== 'authenticated') {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

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

            case 'updateAboutMe':
                const { id: aboutMeId, updates: aboutMeUpdates } = data;
                const updatedAboutMe = await updateSanityDocument(aboutMeId, aboutMeUpdates);
                return json({ success: true, data: updatedAboutMe });

            case 'batchResetSpanTwoColumns':
                // Batch update all gallery images to set spanTwoColumns to false
                const batchResult = await serverClient
                    .patch({ query: '*[_type == "galleryImage" && spanTwoColumns == true]' })
                    .set({ spanTwoColumns: false })
                    .commit();
                return json({ success: true, data: batchResult });

            default:
                return json({ error: 'Invalid operation' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in Sanity API endpoint:', error);
        return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
