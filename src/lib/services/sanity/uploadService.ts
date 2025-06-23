import { isBrowser } from './client';

/**
 * Upload a file to Sanity with configurable retry logic for network errors
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - The uploaded asset
 */
export const uploadFile = async (file: File): Promise<any> => {
    try {
        // Check if we're in a browser environment where File is available
        if (!isBrowser) {
            throw new Error('File upload is only available in browser environment');
        }

        // Import retry configuration
        const { getUploadRetryConfig, calculateRetryDelay, shouldRetryError } = await import(
            '$lib/config/uploadConfig'
        );
        const config = getUploadRetryConfig();

        const attemptUpload = async (attempt: number): Promise<any> => {
            try {
                // Create form data to send the file
                const formData = new FormData();
                formData.append('file', file);

                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Upload timeout')), config.timeoutMs);
                });

                // Send to server endpoint for upload with timeout
                const uploadPromise = fetch('/api/sanity/upload', {
                    method: 'POST',
                    body: formData
                });

                const response = (await Promise.race([uploadPromise, timeoutPromise])) as Response;

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload file');
                }

                const result = await response.json();
                return result.asset;
            } catch (error) {
                // Check if this error should trigger a retry
                const shouldRetry = shouldRetryError(error, config) && attempt < config.maxRetries;

                if (shouldRetry) {
                    // Calculate delay with exponential backoff and jitter
                    const delay = calculateRetryDelay(attempt, config);
                    const fileSize = file.size ? ` (${(file.size / 1024 / 1024).toFixed(2)}MB)` : '';

                    console.warn(
                        `Network error uploading ${file.name}${fileSize}, retrying in ${delay}ms ` +
                            `(attempt ${attempt}/${config.maxRetries}):`,
                        error instanceof Error ? error.message : error
                    );

                    await new Promise((resolve) => setTimeout(resolve, delay));
                    return attemptUpload(attempt + 1);
                }

                // If it's not a retriable error or we've exhausted retries, throw the error
                throw error;
            }
        };

        return await attemptUpload(1);
    } catch (error) {
        console.error('Error uploading file to Sanity:', error);
        throw error;
    }
};
