import { getCategories } from '$lib/services/strapi';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
    console.log(`[DEBUG] Loading Home page server data`);
    const admin = url.searchParams.get('admin') === 'true';
    console.log(`[DEBUG] Admin mode: ${admin}`);

    try {
        console.log(`[DEBUG] Fetching categories from server`);
        const categories = await getCategories();
        console.log(`[DEBUG] Server received ${categories.length} categories`);
        
        // Log thumbnail information
        const withThumbnails = categories.filter(c => c.attributes.thumbnail?.data?.attributes?.url);
        console.log(`[DEBUG] Server - Categories with thumbnail URLs: ${withThumbnails.length}/${categories.length}`);
        
        // Basic data structure validation
        categories.forEach((cat, index) => {
            if (!cat.attributes) {
                console.error(`[DEBUG] Category at index ${index} missing attributes property`);
            } else if (!cat.attributes.name) {
                console.error(`[DEBUG] Category at index ${index} missing name property`);
            }
            
            // Thumbnail structure check
            if (cat.attributes?.thumbnail) {
                if (!cat.attributes.thumbnail.data) {
                    console.error(`[DEBUG] Category ${cat.attributes.name} has thumbnail but missing data property`);
                } else if (cat.attributes.thumbnail.data === null) {
                    console.warn(`[DEBUG] Category ${cat.attributes.name} has null thumbnail data`);
                } else if (!cat.attributes.thumbnail.data.attributes) {
                    console.error(`[DEBUG] Category ${cat.attributes.name} has thumbnail data but missing attributes`);
                } else if (!cat.attributes.thumbnail.data.attributes.url) {
                    console.error(`[DEBUG] Category ${cat.attributes.name} has thumbnail attributes but missing url`);
                }
            }
        });

        return {
            categories,
            admin
        };
    } catch (err) {
        console.error('[DEBUG] Error loading categories:', err);
        throw error(500, 'Failed to load categories');
    }
}
