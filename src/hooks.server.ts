import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Check if this is an admin route (except login and reset password)
    const isAdminRoute = event.url.pathname.startsWith('/admin');
    const isLoginRoute = event.url.pathname === '/admin';
    const isResetRoute = event.url.pathname.startsWith('/admin/reset-password');

    // Only protect admin routes that aren't login/reset
    if (isAdminRoute && !isLoginRoute && !isResetRoute) {
        // Check for admin session cookie
        const session = event.cookies.get('admin_session');

        // If no session, redirect to login
        if (!session || session !== 'authenticated') {
            throw redirect(303, '/admin');
        }
    }

    const response = await resolve(event);
    return response;
}; 