import { getCategories } from '$lib/services/strapi';

export async function load() {
    const categories = await getCategories();

    return {
        categories
    };
}
