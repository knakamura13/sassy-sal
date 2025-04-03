import { getCategories } from '$lib/services/strapi';

// Helper function to test basic connectivity
async function testConnection(strapiUrl) {
    try {
        const response = await fetch(`${strapiUrl}/api/healthcheck`);
        if (response.ok) {
            return { success: true, message: 'Connection successful' };
        } else {
            return {
                success: false,
                message: `Connection failed with status: ${response.status}`,
                details: await response.text().catch(() => 'No details available')
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Connection failed',
            error: error.message
        };
    }
}

// Helper to test API endpoints
async function testEndpoint(strapiUrl, endpoint) {
    try {
        const response = await fetch(`${strapiUrl}/api/${endpoint}`);
        const status = response.status;
        let data = null;
        let error = null;

        if (response.ok) {
            try {
                data = await response.json();
            } catch (e) {
                error = 'Failed to parse JSON response';
            }
        } else {
            error = await response.text().catch(() => 'Failed to read error response');
        }

        return {
            success: response.ok,
            status,
            data,
            error
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function load({ fetch }) {
    const strapiUrl = import.meta.env.STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';

    // Test basic connectivity
    const connectionStatus = await testConnection(strapiUrl);

    // Test specific endpoints
    const endpoints = {
        categories: await testEndpoint(strapiUrl, 'categories'),
        upload: await testEndpoint(strapiUrl, 'upload/settings')
    };

    // Test data loading through our services
    let serviceData = { success: false, error: null, data: null };
    try {
        const categories = await getCategories();
        serviceData = {
            success: true,
            data: categories,
            count: categories?.length || 0
        };
    } catch (error) {
        serviceData = {
            success: false,
            error: error.message
        };
    }

    return {
        strapiUrl,
        connectionStatus,
        endpoints,
        serviceData,
        timestamp: new Date().toISOString()
    };
}
