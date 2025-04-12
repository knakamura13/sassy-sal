import { fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

import type { Actions } from './$types';

// Access the reset tokens storage
// Note: In a real app, this would be a database
declare const resetTokens: Record<string, { token: string; expires: Date }>;

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const token = data.get('token') as string;
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        // Validate inputs
        if (!token || !email || !password) {
            return fail(400, {
                message: 'All fields are required'
            });
        }

        // Check if token exists and is valid
        const tokenData = resetTokens[email];
        if (!tokenData || tokenData.token !== token) {
            return fail(400, {
                message: 'Invalid or expired token'
            });
        }

        // Check if token is expired
        if (new Date() > tokenData.expires) {
            // Clean up expired token
            delete resetTokens[email];

            return fail(400, {
                message: 'Token has expired, please request a new one'
            });
        }

        try {
            // Hash the new password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // In a real application, you would update the password in the database
            // For this example, we'll update the environment variable
            console.log('[Password Reset] New password hash:', passwordHash);
            console.log('[Password Reset] Update your ADMIN_PASSWORD_HASH environment variable with this value');

            // Clean up the used token
            delete resetTokens[email];

            return { success: true };
        } catch (error) {
            console.error('Failed to reset password:', error);
            return fail(500, {
                message: 'Failed to update password'
            });
        }
    }
};
