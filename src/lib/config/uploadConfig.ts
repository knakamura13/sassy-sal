import { browser } from '$app/environment';

export interface UploadRetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    timeoutMs: number;
    retryOnNetworkErrors: boolean;
}

/**
 * Get upload retry configuration from environment variables with fallback defaults
 */
export function getUploadRetryConfig(): UploadRetryConfig {
    // Get environment variables with sensible defaults
    const maxRetries = browser
        ? parseInt(import.meta.env.VITE_UPLOAD_MAX_RETRIES || '3', 10)
        : parseInt(process.env.UPLOAD_MAX_RETRIES || '3', 10);

    const initialDelayMs = browser
        ? parseInt(import.meta.env.VITE_UPLOAD_INITIAL_DELAY_MS || '1000', 10)
        : parseInt(process.env.UPLOAD_INITIAL_DELAY_MS || '1000', 10);

    const maxDelayMs = browser
        ? parseInt(import.meta.env.VITE_UPLOAD_MAX_DELAY_MS || '8000', 10)
        : parseInt(process.env.UPLOAD_MAX_DELAY_MS || '8000', 10);

    const timeoutMs = browser
        ? parseInt(import.meta.env.VITE_UPLOAD_TIMEOUT_MS || '60000', 10)
        : parseInt(process.env.UPLOAD_TIMEOUT_MS || '60000', 10);

    const retryOnNetworkErrors = browser
        ? (import.meta.env.VITE_UPLOAD_RETRY_ON_NETWORK_ERRORS || 'true').toLowerCase() === 'true'
        : (process.env.UPLOAD_RETRY_ON_NETWORK_ERRORS || 'true').toLowerCase() === 'true';

    return {
        maxRetries: Math.max(0, Math.min(maxRetries, 10)), // Cap between 0-10 retries
        initialDelayMs: Math.max(100, Math.min(initialDelayMs, 5000)), // Cap between 100ms-5s
        maxDelayMs: Math.max(1000, Math.min(maxDelayMs, 30000)), // Cap between 1s-30s
        timeoutMs: Math.max(5000, Math.min(timeoutMs, 300000)), // Cap between 5s-5min
        retryOnNetworkErrors
    };
}

/**
 * Calculate delay for exponential backoff with jitter
 */
export function calculateRetryDelay(attempt: number, config: UploadRetryConfig): number {
    // Exponential backoff: initialDelay * (2 ^ (attempt - 1))
    const exponentialDelay = config.initialDelayMs * Math.pow(2, attempt - 1);

    // Cap at maxDelayMs
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Add jitter (±25% randomization) to prevent thundering herd
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);

    return Math.round(cappedDelay + jitter);
}

/**
 * Check if an error should trigger a retry based on configuration
 */
export function shouldRetryError(error: unknown, config: UploadRetryConfig): boolean {
    if (!config.retryOnNetworkErrors) {
        return false;
    }

    // Check if this is a network error that we should retry
    if (error instanceof TypeError) {
        const message = error.message.toLowerCase();
        return (
            message.includes('failed to fetch') ||
            message.includes('networkerror') ||
            message.includes('err_network_changed') ||
            message.includes('connection') ||
            message.includes('timeout')
        );
    }

    // Check for fetch response errors that might be transient
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('connection reset') ||
            message.includes('connection refused')
        );
    }

    return false;
}
