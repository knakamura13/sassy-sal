import { type Handle, redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Check if this is an admin route (except login)
    const isAdminRoute = event.url.pathname.startsWith('/admin');
    const isLoginRoute = event.url.pathname === '/admin';

    // Only protect admin routes that aren't login
    if (isAdminRoute && !isLoginRoute) {
        // Check for admin session cookie
        const session = event.cookies.get('admin_session');

        // If no session, redirect to admin page
        if (!session || session !== 'authenticated') {
            throw redirect(303, '/admin');
        }
    }

    // Add long cache headers for font files
    const response = await resolve(event);
    const pathname = event.url.pathname;

    if (pathname.match(/\.(woff2|woff|ttf|otf)$/i)) {
        // Set long cache for font files (1 year)
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
};
