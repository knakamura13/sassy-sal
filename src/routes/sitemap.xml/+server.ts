import type { RequestHandler } from './$types';
import { getCategories } from '$lib/services/sanity/categoryService';

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const origin = url.origin;
    const basePaths = ['', '/about-me'];

    const categories = await getCategories();
    const categoryPaths = categories.map((cat) => `/${slugify(cat.attributes.name)}`);

    const urls = [...basePaths, ...categoryPaths]
        .map((path) => `${origin}${path}`)
        .map((loc) => `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
        .join('');

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    setHeaders({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200'
    });

    return new Response(body);
};
