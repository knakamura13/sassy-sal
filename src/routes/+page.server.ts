import type { PageServerLoad } from './$types';
import { getCategories } from '$lib/services/sanity/categoryService';

export const load: PageServerLoad = async ({ cookies, setHeaders }) => {
    const isAdmin = cookies.get('admin_session') === 'authenticated';
    const categories = await getCategories({ bypassCache: isAdmin });

    // Cache public responses at the CDN/edge but keep admin views fresh
    if (isAdmin) {
        setHeaders({ 'Cache-Control': 'private, no-store' });
    } else {
        setHeaders({ 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' });
    }

    return { categories };
};
