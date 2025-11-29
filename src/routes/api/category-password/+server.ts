import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { client } from '$lib/services/sanity/client';
import { transformCategoryWithImages } from '$lib/services/sanity/transformers';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { categoryId, categoryName, password } = await request.json();

        if ((!categoryId && !categoryName) || !password) {
            throw error(400, 'Category identifier and password are required');
        }

        const isById = !!categoryId;
        const identifier = categoryId || categoryName;

        const query = isById
            ? `*[_type == "category" && _id == $identifier][0] {
                _id,
                name,
                order,
                thumbnail,
                password,
                "images": *[_type == "galleryImage" && references(^._id)] | order(order asc) {
                    _id,
                    _type,
                    order,
                    spanTwoColumns,
                    image {
                        ...,
                        asset-> {
                            _id,
                            url,
                            metadata {
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        }
                    }
                }
            }`
            : `*[_type == "category" && name == $identifier][0] {
                _id,
                name,
                order,
                thumbnail,
                password,
                "images": *[_type == "galleryImage" && references(^._id)] | order(order asc) {
                    _id,
                    _type,
                    order,
                    spanTwoColumns,
                    image {
                        ...,
                        asset-> {
                            _id,
                            url,
                            metadata {
                                dimensions {
                                    width,
                                    height
                                }
                            }
                        }
                    }
                }
            }`;

        const category = await client.fetch(query, { identifier });

        if (!category) {
            throw error(404, 'Category not found');
        }

        // If not password protected, allow access
        if (!category.password) {
            const sanitized = transformCategoryWithImages(category);
            return json({ success: true, category: sanitized });
        }

        if (category.password !== password) {
            return json({ success: false, error: 'Incorrect password' }, { status: 401 });
        }

        // Password ok - strip password before returning
        const sanitizedCategory = transformCategoryWithImages(category);

        // Set a short-lived session cookie so the user doesn't re-enter the password repeatedly
        cookies.set(`category_access_${category._id}`, 'granted', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 6 // 6 hours
        });

        return json({ success: true, category: sanitizedCategory });
    } catch (err: any) {
        if (err.status) {
            throw err;
        }
        console.error('Error verifying category password:', err);
        throw error(500, 'Failed to verify password');
    }
};
