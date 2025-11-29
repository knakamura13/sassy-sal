import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const origin = url.origin;
    const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

    setHeaders({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=172800'
    });

    return new Response(body);
};
