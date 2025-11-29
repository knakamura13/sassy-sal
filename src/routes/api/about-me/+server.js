import { json } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '$env/static/private';

/**
 * Handle POST requests to /api/about-me
 */
export async function POST({ request }) {
    try {
        // Parse the request body
        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            return json(
                { error: 'Name, email, and message are required' },
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                // Prefer server-only secrets, fall back to legacy VITE vars for compatibility
                user: EMAIL_USER || import.meta.env.VITE_EMAIL_USER || 'sallyjkphoto@gmail.com',
                pass: EMAIL_PASSWORD || import.meta.env.VITE_EMAIL_PASSWORD
            }
        });

        // Format email subject and body
        const subject = data.subject || 'New Contact Form Submission';
        const htmlBody = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            ${data.referral ? `<p><strong>Referral:</strong> ${data.referral}</p>` : ''}
            <h3>Message:</h3>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
        `;

        // Send email
        await transporter.sendMail({
            from: EMAIL_USER || import.meta.env.VITE_EMAIL_USER || 'sallyjkphoto@gmail.com',
            to: EMAIL_USER || import.meta.env.VITE_EMAIL_USER || 'sallyjkphoto@gmail.com',
            replyTo: data.email,
            subject,
            html: htmlBody,
            text: htmlBody.replace(/<[^>]*>/g, '') // Strip HTML for plain text version
        });

        return json(
            { success: true, message: 'Email sent successfully' },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        return json(
            { error: 'Failed to send email' },
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
