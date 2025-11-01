import { type HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, event }) => {
    console.error('Client-side error:', error, 'Event:', event);

    // Check if it's a Sanity-related error
    if (error instanceof Error && error.message.includes('sanity.io')) {
        return {
            message: 'Unable to load content from our content management system. Please try refreshing the page.',
            code: 'SANITY_ERROR'
        };
    }

    // Check if it's a network error
    if (
        error instanceof Error &&
        (error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('Request error'))
    ) {
        return {
            message: 'Network connection issue. Please check your internet connection and try again.',
            code: 'NETWORK_ERROR'
        };
    }

    // Generic error fallback
    return {
        message: 'An unexpected error occurred. Please try refreshing the page.',
        code: 'UNKNOWN_ERROR'
    };
};
