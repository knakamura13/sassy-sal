import { fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

import type { Actions } from './$types';

// Store for password reset tokens (would be a database in production)
const resetTokens: Record<string, { token: string, expires: Date }> = {};

// Verify the password against the hashed version in the environment variable
async function verifyPassword(password: string): Promise<boolean> {
    const storedHash = process.env.ADMIN_PASSWORD_HASH;

    // For development/testing if hash not set
    if (!storedHash) {
        console.warn('ADMIN_PASSWORD_HASH not set in environment variables!');
        return password === 'password'; // Fallback for development
    }

    // Compare using bcrypt
    return await bcrypt.compare(password, storedHash);
}

// Create a token for password reset
function generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

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

        const isValid = await verifyPassword(password);

        if (!isValid) {
            return fail(401, {
                message: 'Invalid password'
            });
        }

        // Set a secure cookie for session management
        cookies.set('admin_session', 'authenticated', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: 'strict'
        });

        return { success: true };
    },

    // Password reset request action
    resetPassword: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email') as string;

        if (!email) {
            return fail(400, {
                message: 'Email is required'
            });
        }

        const recoveryEmail = process.env.ADMIN_RECOVERY_EMAIL;

        // Verify if this is the correct recovery email
        if (!recoveryEmail || email !== recoveryEmail) {
            // For security, still return success even if email doesn't match
            // This prevents email enumeration
            return { success: true };
        }

        // Generate a reset token
        const token = generateResetToken();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

        // Store the token (would be in a database in production)
        resetTokens[email] = { token, expires };

        // Send the reset email if in production
        if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const resetUrl = `${process.env.PUBLIC_SITE_URL}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || 'noreply@example.com',
                    to: email,
                    subject: 'Photography Portfolio - Password Reset',
                    text: `Click the following link to reset your password: ${resetUrl}`,
                    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
                });
            } catch (error) {
                console.error('Failed to send reset email:', error);
                return fail(500, {
                    message: 'Failed to send reset email'
                });
            }
        } else {
            console.log(`[DEV MODE] Reset token for ${email}: ${token}`);
            console.log(`[DEV MODE] Reset URL: /admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
        }

        return { success: true };
    }
}; 