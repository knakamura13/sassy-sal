import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { VITE_ADMIN_PASSWORD } from '$env/static/private';

export const actions: Actions = {
    // Login action
    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const password = data.get('password') as string;

        if (!password) {
            return fail(400, {
                message: 'Password is required'
            });
        }

        // Simple password check against environment variable
        if (!VITE_ADMIN_PASSWORD) {
            console.warn('VITE_ADMIN_PASSWORD not set in environment variables!');
            // Fallback for development
            if (password !== 'password') {
                return fail(401, { message: 'Invalid password' });
            }
        } else if (password !== VITE_ADMIN_PASSWORD) {
            return fail(401, { message: 'Invalid password' });
        }

        // Set a cookie for session management
        cookies.set('admin_session', 'authenticated', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: 'strict'
        });

        return { success: true };
    }
};
