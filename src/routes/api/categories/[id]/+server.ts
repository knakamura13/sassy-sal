import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSanityDocument } from '$lib/server/sanityServerClient';

export const PATCH: RequestHandler = async ({ params, request }) => {
    try {
        const { id } = params;

        if (!id) {
            return json({ error: 'Category ID is required' }, { status: 400 });
        }

        const updateData = await request.json();

        // Use the server-side Sanity client to update the category
        const result = await updateSanityDocument(id, updateData.data);

        return json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('[DEBUG] Error updating category on server:', error);

        return json(
            {
                error: 'Failed to update category',
                details: error.message
            },
            {
                status: 500
            }
        );
    }
};
