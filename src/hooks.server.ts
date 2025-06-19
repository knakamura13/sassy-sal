import { type Handle, redirect } from '@sveltejs/kit';
import crypto from 'crypto';

export const handle: Handle = async ({ event, resolve }) => {
    // Generate a unique nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');

    // Set the nonce in the event locals so it can be accessed in the app template
    event.locals.nonce = nonce;

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

    // Add transformed HTML to include nonce in script tags
    const response = await resolve(event, {
        transformPageChunk: ({ html }) => {
            return html.replace(/<script\b/g, `<script nonce="${nonce}"`);
        }
    });

    const pathname = event.url.pathname;

    if (pathname.match(/\.(woff2|woff|ttf|otf)$/i)) {
        // Set long cache for font files (1 year)
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Security headers to address Lighthouse warnings

    // 1. Content Security Policy (CSP) to prevent XSS attacks with nonce and strict-dynamic
    response.headers.set(
        'Content-Security-Policy',
        `default-src 'self'; ` +
            `base-uri 'self'; ` +
            `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https: http:; ` +
            `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
            `img-src 'self' data: blob: https://cdn.sanity.io; ` +
            `font-src 'self' https://fonts.gstatic.com; ` +
            `connect-src 'self' https://*.sanity.io; ` +
            `frame-ancestors 'none';`
    );

    // 2. HTTP Strict Transport Security (HSTS)
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. Cross-Origin Opener Policy (COOP)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    // 4. X-Frame-Options (XFO) to prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Additional security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
};
