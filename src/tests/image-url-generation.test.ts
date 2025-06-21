import { describe, it, expect } from 'vitest';
import { getImageUrls } from '$lib/services/imageConfig';
import { urlFor } from '$lib/services/sanityContentService';

describe('Image URL Generation', () => {
    it('should generate image URLs from Sanity image objects', () => {
        // Mock a typical Sanity image object
        const mockSanityImage = {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: 'image-abc123def456-1920x1080-jpg'
            }
        };

        try {
            const urls = getImageUrls(mockSanityImage);

            expect(urls, 'getImageUrls should return an object').toBeDefined();
            expect(urls.placeholder, 'Should have placeholder URL').toBeDefined();
            expect(urls.medium, 'Should have medium URL').toBeDefined();
            expect(urls.large, 'Should have large URL').toBeDefined();
            expect(urls.responsive, 'Should have responsive URLs').toBeDefined();
        } catch (error) {
            console.error('❌ Error in getImageUrls:', error);
            throw error;
        }
    });

    it('should handle urlFor function correctly', () => {
        // Mock a Sanity image object
        const mockSanityImage = {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: 'image-abc123def456-1920x1080-jpg'
            }
        };

        try {
            const urlBuilder = urlFor(mockSanityImage);

            expect(urlBuilder, 'urlFor should return a builder object').toBeDefined();
            expect(typeof urlBuilder.url, 'url should be a function').toBe('function');

            const url = urlBuilder.url();
            expect(url, 'Generated URL should be a string').toBeDefined();
            expect(typeof url, 'URL should be a string').toBe('string');
        } catch (error) {
            console.error('❌ Error in urlFor:', error);
            throw error;
        }
    });

    it('should handle undefined/null image sources gracefully', () => {
        try {
            // Test urlFor with undefined
            const undefinedResult = urlFor(undefined);
            expect(undefinedResult, 'urlFor should handle undefined').toBeDefined();
            expect(undefinedResult.url(), 'Should return empty string for undefined').toBe('');

            // Test urlFor with null
            const nullResult = urlFor(null);
            expect(nullResult, 'urlFor should handle null').toBeDefined();
            expect(nullResult.url(), 'Should return empty string for null').toBe('');
        } catch (error) {
            console.error('❌ Error handling null/undefined in urlFor:', error);
            throw error;
        }
    });

    it('should generate responsive URLs with different sizes', () => {
        const mockSanityImage = {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: 'image-abc123def456-1920x1080-jpg'
            }
        };

        try {
            const urls = getImageUrls(mockSanityImage);

            // Check that responsive URLs are different sizes
            expect(urls.responsive.small, 'Small responsive URL should exist').toBeDefined();
            expect(urls.responsive.medium, 'Medium responsive URL should exist').toBeDefined();
            expect(urls.responsive.large, 'Large responsive URL should exist').toBeDefined();

            // Verify they contain size parameters (w= for width)
            expect(urls.responsive.small, 'Small URL should contain width parameter').toContain('w=');
            expect(urls.responsive.medium, 'Medium URL should contain width parameter').toContain('w=');
            expect(urls.responsive.large, 'Large URL should contain width parameter').toContain('w=');
        } catch (error) {
            console.error('❌ Error generating responsive URLs:', error);
            throw error;
        }
    });
});
