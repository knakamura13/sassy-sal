// test-strapi.js
const STRAPI_API_URL = process.env.STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';

async function testStrapiConnection() {
    try {
        console.log(`Testing connection to: ${STRAPI_API_URL}/api/categories`);
        const response = await fetch(`${STRAPI_API_URL}/api/categories?populate=thumbnail`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Connection successful!');
        console.log(`Found ${data.data?.length || 0} categories`);
        return true;
    } catch (error) {
        console.error('Failed to connect to Strapi:', error);
        return false;
    }
}

testStrapiConnection();
