import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategoryWithImages } from '$lib/services/sanityContentService';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { categoryName, password } = await request.json();

        if (!categoryName || !password) {
            throw error(400, 'Category name and password are required');
        }

        // Fetch the category data including password
        const categoryResponse = await getCategoryWithImages(categoryName);

        if (!categoryResponse || !categoryResponse.data) {
            throw error(404, 'Category not found');
        }

        const category = categoryResponse.data;

        // Check if category has password protection
        if (!category.attributes.password) {
            // Category is not password protected, allow access
            return json({ success: true });
        }

        // Check if provided password matches
        if (category.attributes.password === password) {
            // Set authentication cookie for this category
            const cookieKey = `category_auth_${categoryName.toLowerCase()}`;
            cookies.set(cookieKey, 'true', {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });

            return json({ success: true });
        } else {
            return json({ success: false, error: 'Incorrect password' }, { status: 401 });
        }
    } catch (err: any) {
        console.error('Error verifying category password:', err);

        if (err.status) {
            throw err;
        }

        throw error(500, 'Failed to verify password');
    }
};
