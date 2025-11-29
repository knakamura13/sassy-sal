import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverClient } from '$lib/server/sanityServerClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // Require authenticated admin session
        const session = cookies.get('admin_session');
        if (!session || session !== 'authenticated') {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.formData();
        const file = data.get('file');

        if (!file || !(file instanceof Blob)) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const asset = await serverClient.assets.upload('image', buffer, {
            filename: (file as File).name || 'upload'
        });

        return json({ success: true, asset });
    } catch (err: any) {
        console.error('Upload error:', err);
        return json({ error: err?.message || 'Failed to upload file' }, { status: 500 });
    }
};
