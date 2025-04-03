import { STRAPI_API_URL } from '$lib/services/strapi';

export async function load() {
    // Get the Strapi API URL from your configuration
    const apiUrl = STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';

    try {
        // Test the categories endpoint directly
        const categoriesUrl = `${apiUrl}/api/categories?populate=thumbnail`;
        console.log(`🔍 Testing direct API request to: ${categoriesUrl}`);

        const categoriesResponse = await fetch(categoriesUrl);
        const categoriesData = await categoriesResponse.json();

        // Get a specific category to test that endpoint
        let testCategorySlug = '';

        if (categoriesData.data && categoriesData.data.length > 0) {
            // Find the first category and get its slug
            const firstCategory = categoriesData.data[0];
            testCategorySlug = firstCategory.attributes?.slug || '';

            console.log(`✅ Found test category with slug: '${testCategorySlug}'`);
        }

        // Test the specific category endpoint if we found a slug to test
        let categoryData = null;
        if (testCategorySlug) {
            const categoryUrl = `${apiUrl}/api/categories?filters[slug][$eq]=${testCategorySlug}&populate[images][populate][0]=image`;
            console.log(`🔍 Testing category API request to: ${categoryUrl}`);

            const categoryResponse = await fetch(categoryUrl);
            categoryData = await categoryResponse.json();
        }

        return {
            apiUrl,
            categoriesResponse: {
                status: categoriesResponse.status,
                statusText: categoriesResponse.statusText,
                data: categoriesData
            },
            categoryResponse: categoryData
                ? {
                      slug: testCategorySlug,
                      status: 200,
                      data: categoryData
                  }
                : null
        };
    } catch (error) {
        console.error('❌ API test error:', error);
        return {
            apiUrl,
            error: {
                message: error.message,
                stack: error.stack
            }
        };
    }
}
