import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@sanity/client';

// Test configuration
interface TestConfig {
    projectId: string;
    dataset: string;
    apiVersion: string;
    token: string;
}

describe('Sanity API Permissions', () => {
    let testConfig: TestConfig;
    let client: ReturnType<typeof createClient>;
    let testDocumentId: string | null = null;

    beforeAll(() => {
        // Get configuration from environment variables
        testConfig = {
            projectId: process.env.VITE_SANITY_PROJECT_ID!,
            dataset: process.env.VITE_SANITY_DATASET || 'production',
            apiVersion: process.env.VITE_SANITY_API_VERSION || '2023-05-03',
            token: process.env.SANITY_API_TOKEN!
        };

        // Create authenticated client
        client = createClient({
            projectId: testConfig.projectId,
            dataset: testConfig.dataset,
            apiVersion: testConfig.apiVersion,
            token: testConfig.token,
            useCdn: false // Don't use CDN for write operations
        });
    });

    afterAll(async () => {
        // Clean up any test documents
        if (testDocumentId && client) {
            try {
                await client.delete(testDocumentId);
                console.log(`✅ Cleaned up test document: ${testDocumentId}`);
            } catch (error) {
                console.warn(`⚠️ Could not clean up test document: ${error}`);
            }
        }
    });

    it('should have all required environment variables', () => {
        expect(testConfig.projectId, 'VITE_SANITY_PROJECT_ID is required').toBeDefined();
        expect(testConfig.projectId, 'VITE_SANITY_PROJECT_ID cannot be empty').not.toBe('');

        expect(testConfig.token, 'SANITY_API_TOKEN is required').toBeDefined();
        expect(testConfig.token, 'SANITY_API_TOKEN cannot be empty').not.toBe('');

        expect(testConfig.dataset, 'Dataset should be defined').toBeDefined();
        expect(testConfig.apiVersion, 'API version should be defined').toBeDefined();

        console.log(`📊 Testing Sanity project: ${testConfig.projectId}`);
        console.log(`📊 Dataset: ${testConfig.dataset}`);
        console.log(`📊 API Version: ${testConfig.apiVersion}`);
    });

    it('should authenticate successfully and validate API key', async () => {
        expect(client, 'Sanity client should be created').toBeDefined();

        // Test authentication by trying to get user info
        try {
            const result = await client.request({
                uri: '/users/me',
                method: 'GET'
            });

            expect(result, 'User info should be returned').toBeDefined();
            console.log(`✅ Authentication successful for user: ${result.displayName || result.email || 'Unknown'}`);
        } catch (error: any) {
            if (error.statusCode === 401) {
                throw new Error('❌ API key is invalid or expired');
            } else if (error.statusCode === 403) {
                throw new Error('❌ API key lacks necessary permissions');
            } else {
                throw new Error(`❌ Authentication failed: ${error.message}`);
            }
        }
    });

    it('should have read permissions for categories', async () => {
        try {
            // Test reading categories
            const categories = await client.fetch(`*[_type == "category"] | order(order asc) [0...5] {
				_id,
				name,
				order
			}`);

            expect(categories, 'Categories query should return an array').toBeInstanceOf(Array);
            console.log(`✅ Read permissions confirmed. Found ${categories.length} categories`);

            // Log first few categories for debugging
            if (categories.length > 0) {
                console.log(
                    `📋 Sample categories:`,
                    categories.slice(0, 3).map((c: any) => ({ id: c._id, name: c.name }))
                );
            }
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks read permissions for categories');
            } else {
                throw new Error(`❌ Failed to read categories: ${error.message}`);
            }
        }
    });

    it('should have read permissions for gallery images', async () => {
        try {
            // Test reading gallery images
            const images = await client.fetch(`*[_type == "galleryImage"] | order(_createdAt desc) [0...5] {
				_id,
				order,
				_createdAt
			}`);

            expect(images, 'Gallery images query should return an array').toBeInstanceOf(Array);
            console.log(`✅ Read permissions confirmed. Found ${images.length} gallery images`);
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks read permissions for gallery images');
            } else {
                throw new Error(`❌ Failed to read gallery images: ${error.message}`);
            }
        }
    });

    it('should have write permissions - create test document', async () => {
        const testDoc = {
            _type: 'category',
            name: `test-category-${Date.now()}`,
            order: 9999 // High number to ensure it appears last
        };

        try {
            const result = await client.create(testDoc);

            expect(result, 'Document creation should return a result').toBeDefined();
            expect(result._id, 'Created document should have an ID').toBeDefined();

            testDocumentId = result._id;
            console.log(`✅ Write permissions confirmed. Created test document: ${testDocumentId}`);
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks write permissions for creating documents');
            } else if (error.statusCode === 401) {
                throw new Error('❌ API key is invalid for write operations');
            } else {
                throw new Error(`❌ Failed to create test document: ${error.message}`);
            }
        }
    });

    it('should have update permissions - modify test document', async () => {
        if (!testDocumentId) {
            throw new Error('❌ No test document available for update test');
        }

        const updateData = {
            name: `updated-test-category-${Date.now()}`,
            order: 9998
        };

        try {
            const result = await client.patch(testDocumentId).set(updateData).commit();

            expect(result, 'Document update should return a result').toBeDefined();
            expect(result._id, 'Updated document should have the same ID').toBe(testDocumentId);

            console.log(`✅ Update permissions confirmed. Updated document: ${testDocumentId}`);
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks update permissions');
            } else {
                throw new Error(`❌ Failed to update test document: ${error.message}`);
            }
        }
    });

    it('should have delete permissions - remove test document', async () => {
        if (!testDocumentId) {
            throw new Error('❌ No test document available for delete test');
        }

        try {
            const result = await client.delete(testDocumentId);

            expect(result, 'Document deletion should return a result').toBeDefined();
            console.log(`✅ Delete permissions confirmed. Deleted document: ${testDocumentId}`);

            // Clear the ID so afterAll doesn't try to delete it again
            testDocumentId = null;
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks delete permissions');
            } else {
                throw new Error(`❌ Failed to delete test document: ${error.message}`);
            }
        }
    });

    it('should have asset upload permissions', async () => {
        // Create a minimal test image buffer (1x1 transparent PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
            0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d,
            0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
        ]);

        try {
            const asset = await client.assets.upload('image', testImageBuffer, {
                filename: `test-image-${Date.now()}.png`,
                contentType: 'image/png'
            });

            expect(asset, 'Asset upload should return a result').toBeDefined();
            expect(asset._id, 'Uploaded asset should have an ID').toBeDefined();

            console.log(`✅ Asset upload permissions confirmed. Uploaded asset: ${asset._id}`);

            // Clean up the test asset
            try {
                await client.delete(asset._id);
                console.log(`✅ Cleaned up test asset: ${asset._id}`);
            } catch (cleanupError) {
                console.warn(`⚠️ Could not clean up test asset: ${cleanupError}`);
            }
        } catch (error: any) {
            if (error.statusCode === 403) {
                throw new Error('❌ API key lacks asset upload permissions');
            } else if (error.statusCode === 413) {
                throw new Error('❌ Upload size limit exceeded (should not happen with test image)');
            } else {
                throw new Error(`❌ Failed to upload test asset: ${error.message}`);
            }
        }
    });
});
