import type { PageServerLoad } from './$types';
import { getCategories } from '$lib/services/sanity';

export const load: PageServerLoad = async ({ cookies }) => {
    const categories = await getCategories();
    const adminSession = cookies.get('admin_session');
    const admin = adminSession === 'authenticated';
    return { categories, admin };
}; 