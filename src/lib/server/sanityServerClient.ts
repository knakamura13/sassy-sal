import { createClient } from '@sanity/client';
import { SANITY_API_TOKEN } from '$env/static/private';

// Create a server-side authenticated Sanity client
export const serverClient = createClient({
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
    dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
    apiVersion: import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03',
    token: SANITY_API_TOKEN,
    // Keep useCdn false for server-side clients performing write operations
    // This ensures requests go directly to Sanity's API rather than through CDN,
    // which is necessary for real-time data and proper authentication
    useCdn: false
});

// Export server-side only operations
export async function createSanityDocument(doc: any) {
    return serverClient.create(doc);
}

export async function updateSanityDocument(id: string, updates: any) {
    return serverClient.patch(id).set(updates).commit();
}

export async function deleteSanityDocument(id: string) {
    return serverClient.delete(id);
}

export async function uploadSanityAsset(type: 'file' | 'image', buffer: Buffer, options: any) {
    return serverClient.assets.upload(type, buffer, options);
}
