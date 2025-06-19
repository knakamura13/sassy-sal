import { beforeAll } from 'vitest';
import { config } from 'dotenv';

// Load environment variables for testing
beforeAll(() => {
    // Load .env file for testing
    config();

    // Ensure we have required environment variables
    if (!process.env.VITE_SANITY_PROJECT_ID) {
        console.warn('⚠️ VITE_SANITY_PROJECT_ID not found in environment variables');
    }

    if (!process.env.SANITY_API_TOKEN) {
        console.warn('⚠️ SANITY_API_TOKEN not found in environment variables');
    }
});
