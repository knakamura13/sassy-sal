import type { PageServerLoad } from './$types';
import { getCategories } from '$lib/services/sanity/categoryService';

export const load: PageServerLoad = async () => {
    const categories = await getCategories();
    return { categories };
};
