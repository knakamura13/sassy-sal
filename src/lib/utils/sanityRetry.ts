/**
 * Utility function to handle Sanity requests with retry logic and exponential backoff
 */

export interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
}

export class SanityRetryError extends Error {
    constructor(
        message: string,
        public readonly originalError: Error,
        public readonly attempts: number
    ) {
        super(message);
        this.name = 'SanityRetryError';
    }
}

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2, jitter = true } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // If this is the last attempt, throw the error
            if (attempt === maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff
            let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

            // Add jitter to prevent thundering herd
            if (jitter) {
                delay += Math.random() * 1000;
            }

            console.warn(`Sanity request attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`, error);

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new SanityRetryError(
        `Failed after ${maxRetries + 1} attempts: ${lastError!.message}`,
        lastError!,
        maxRetries + 1
    );
}

/**
 * Checks if an error is retryable (network/temporary errors)
 */
export function isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network-related errors that are worth retrying
    const retryablePatterns = [
        'request error',
        'network error',
        'fetch',
        'timeout',
        'connection',
        'econnreset',
        'enotfound',
        'econnrefused',
        '503',
        '502',
        '504',
        '429' // Rate limiting
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Wrapper for Sanity client fetch with automatic retry
 */
export async function sanityFetchWithRetry<T>(
    client: any,
    query: string,
    params?: any,
    options: RetryOptions = {}
): Promise<T> {
    return withRetry(() => client.fetch(query, params), {
        maxRetries: 3,
        baseDelay: 1000,
        ...options
    });
}
