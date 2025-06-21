import type { Image } from '$lib/stores/imageStore';
import { findImageChanges } from '$lib/utils/imageUtils';
import { showToast } from '$lib/utils';
import type { CDNCacheManager } from './cdnCacheManager';

interface UploadProgressCallbacks {
    onProgress: (step: number, total: number, percentage: number, message: string, operation: string) => void;
    onFileProgress: (uploadedBytes: number, totalBytes: number, speed: number) => void;
    onComplete: (success: boolean, newImages: Image[]) => void;
    onCancel: () => void;
}

interface SaveChangesOptions {
    localImages: Image[];
    originalImages: Image[];
    categoryId: string;
    useCdn: boolean;
    cacheManager?: CDNCacheManager;
    progressCallbacks?: UploadProgressCallbacks;
}

export class ImageOperationsService {
    private isSaving = false;
    private isCanceled = false;
    private uploadStartTime = 0;
    private uploadedFileSizeBytes = 0;
    private totalFileSizeBytes = 0;
    private failedUploads: { image: Image; error: string }[] = [];

    // Function to handle saving changes
    async saveChanges(
        options: SaveChangesOptions
    ): Promise<{ success: boolean; newImages: Image[]; failedUploads: { image: Image; error: string }[] }> {
        if (this.isSaving) {
            return { success: false, newImages: [], failedUploads: [] };
        }

        this.isSaving = true;
        this.isCanceled = false;
        this.failedUploads = []; // Reset failed uploads

        let allProcessingComplete = false;
        const newlyUploadedImages: Image[] = [];

        const { localImages, originalImages, categoryId, useCdn, cacheManager, progressCallbacks } = options;

        // Find images to add, update, or remove
        const { imagesToAdd, imagesToRemove, imagesToUpdate } = findImageChanges(localImages, originalImages);

        // Reset file size tracking
        this.totalFileSizeBytes = 0;
        this.uploadedFileSizeBytes = 0;

        // Calculate total file size to upload
        const filesToUpload = [...imagesToAdd.filter((img) => img.file), ...imagesToUpdate.filter((img) => img.file)];

        for (const image of filesToUpload) {
            if (image.file) {
                this.totalFileSizeBytes += image.file.size;
            }
        }

        // Calculate total operations for progress tracking
        const uploadTotal = imagesToRemove.length + imagesToAdd.length + imagesToUpdate.length;
        let uploadStep = 0;

        // Only show progress dialog if there are operations to perform
        if (uploadTotal > 0) {
            progressCallbacks?.onProgress(uploadStep, uploadTotal, 0, 'Preparing to process images...', 'Processing');
            this.uploadStartTime = Date.now();
        }

        try {
            // Import Sanity services
            const { addImage, deleteImage, updateImage } = await import('$lib/services/sanityContentService');

            // Process deletions first
            if (imagesToRemove.length > 0) {
                progressCallbacks?.onProgress(uploadStep, uploadTotal, 0, 'Deleting images...', 'Deleting');

                for (const image of imagesToRemove) {
                    if (this.isCanceled) break;

                    try {
                        await deleteImage(image.id);

                        // Remove from cache if present
                        cacheManager?.clearCachedImage(image.id);

                        uploadStep++;
                        const percentage = Math.round((uploadStep / uploadTotal) * 100);
                        progressCallbacks?.onProgress(
                            uploadStep,
                            uploadTotal,
                            percentage,
                            `Deleting image ${uploadStep} of ${imagesToRemove.length}...`,
                            'Deleting'
                        );
                    } catch (error) {
                        console.error('Error deleting image:', error);
                        this.failedUploads.push({
                            image,
                            error: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                        uploadStep++;
                        // Continue with other deletions even if one fails
                    }
                }
            }

            // Process additions
            if (imagesToAdd.length > 0 && !this.isCanceled) {
                progressCallbacks?.onProgress(uploadStep, uploadTotal, 0, 'Uploading new images...', 'Uploading');

                for (let i = 0; i < imagesToAdd.length; i++) {
                    if (this.isCanceled) break;

                    const image = imagesToAdd[i];
                    if (!image.file) {
                        uploadStep++;
                        continue;
                    }

                    try {
                        // Prepare image data for API
                        const imageData = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0),
                            image: image.file,
                            category: categoryId
                        };

                        const fileSize = image.file.size;
                        const fileSizeFormatted = this.formatFileSize(fileSize);

                        progressCallbacks?.onProgress(
                            uploadStep,
                            uploadTotal,
                            Math.round((uploadStep / uploadTotal) * 100),
                            `Uploading image ${i + 1} of ${imagesToAdd.length} (${fileSizeFormatted})...`,
                            'Uploading'
                        );

                        // Add the image in Sanity
                        const uploadResult = await addImage(imageData);

                        // Create a copy of this image that we can cache (only if CDN is enabled)
                        if (uploadResult?.data?.id) {
                            const uploadedImage = {
                                ...image,
                                id: uploadResult.data.id,
                                // Keep local URLs for immediate display until CDN is ready
                                url: image.url,
                                thumbnailUrl: image.thumbnailUrl || image.url,
                                fullSizeUrl: image.fullSizeUrl || image.url,
                                // Store the CDN URLs for checking availability (only if CDN is enabled)
                                ...(useCdn && { cdnUrl: uploadResult.data.attributes?.image?.data?.attributes?.url }),
                                // Store additional metadata
                                uploadedAt: new Date().getTime(),
                                categoryId
                            };

                            // Add to the list of uploaded images for session storage (only if CDN is enabled)
                            if (useCdn) {
                                newlyUploadedImages.push(uploadedImage);
                            }
                        }

                        // Update upload statistics
                        this.uploadedFileSizeBytes += fileSize;
                        this.updateUploadSpeed();
                        progressCallbacks?.onFileProgress(
                            this.uploadedFileSizeBytes,
                            this.totalFileSizeBytes,
                            this.getUploadSpeed()
                        );

                        uploadStep++;
                    } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                        console.error('Error adding image:', err);

                        // Track this as a failed upload
                        this.failedUploads.push({
                            image,
                            error: `Failed to upload: ${errorMessage}`
                        });

                        uploadStep++;
                        // Continue with other uploads even if one fails
                    }
                }
            }

            // Process updates
            if (imagesToUpdate.length > 0 && !this.isCanceled) {
                progressCallbacks?.onProgress(uploadStep, uploadTotal, 0, 'Updating images...', 'Updating');

                for (let i = 0; i < imagesToUpdate.length; i++) {
                    if (this.isCanceled) break;

                    const image = imagesToUpdate[i];
                    try {
                        // Prepare update data
                        const updateData: any = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0)
                        };

                        // Include file if present
                        if (image.file) {
                            updateData.image = image.file;
                            const fileSize = image.file.size;
                            const fileSizeFormatted = this.formatFileSize(fileSize);

                            progressCallbacks?.onProgress(
                                uploadStep,
                                uploadTotal,
                                Math.round((uploadStep / uploadTotal) * 100),
                                `Updating image ${i + 1} of ${imagesToUpdate.length} with new file (${fileSizeFormatted})...`,
                                'Updating'
                            );

                            // Store the update in cache (only if CDN is enabled)
                            if (useCdn) {
                                const updatedImage = {
                                    ...image,
                                    // Keep local URLs for immediate display until CDN is ready
                                    url: URL.createObjectURL(image.file),
                                    thumbnailUrl: URL.createObjectURL(image.file),
                                    fullSizeUrl: URL.createObjectURL(image.file),
                                    // Store additional metadata
                                    updatedAt: new Date().getTime(),
                                    categoryId
                                };

                                // Add to cache
                                newlyUploadedImages.push(updatedImage);
                            }
                        } else {
                            progressCallbacks?.onProgress(
                                uploadStep,
                                uploadTotal,
                                Math.round((uploadStep / uploadTotal) * 100),
                                `Updating image ${i + 1} of ${imagesToUpdate.length}...`,
                                'Updating'
                            );
                        }

                        // Update the image
                        await updateImage(image.id, updateData);

                        // Update upload statistics if we uploaded a file
                        if (image.file) {
                            this.uploadedFileSizeBytes += image.file.size;
                            this.updateUploadSpeed();
                            progressCallbacks?.onFileProgress(
                                this.uploadedFileSizeBytes,
                                this.totalFileSizeBytes,
                                this.getUploadSpeed()
                            );
                        }

                        uploadStep++;
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Error updating image:', error);

                        // Track this as a failed upload
                        this.failedUploads.push({
                            image,
                            error: `Failed to update: ${errorMessage}`
                        });

                        uploadStep++;
                        // Continue with other updates even if one fails
                    }
                }
            }

            // Store newly uploaded images in cache (only if CDN is enabled)
            if (useCdn && newlyUploadedImages.length > 0 && cacheManager) {
                cacheManager.storeUploadedImages(newlyUploadedImages);
            }

            // Mark all processing as complete
            allProcessingComplete = true;

            // Set final progress state
            if (this.isCanceled) {
                progressCallbacks?.onProgress(uploadStep, uploadTotal, 100, 'Upload process canceled.', 'Canceled');
                progressCallbacks?.onCancel();
            } else {
                const hasFailures = this.failedUploads.length > 0;
                const successCount = uploadTotal - this.failedUploads.length;

                let finalMessage = 'All images processed successfully!';
                if (hasFailures) {
                    finalMessage = `${successCount} of ${uploadTotal} images processed successfully. ${this.failedUploads.length} failed.`;
                }

                progressCallbacks?.onProgress(
                    uploadStep,
                    uploadTotal,
                    100,
                    finalMessage,
                    hasFailures ? 'Partial Success' : 'Complete'
                );
                progressCallbacks?.onComplete(!hasFailures, newlyUploadedImages);
            }

            return {
                success: !this.isCanceled && allProcessingComplete && this.failedUploads.length === 0,
                newImages: newlyUploadedImages,
                failedUploads: this.failedUploads
            };
        } catch (error) {
            console.error('Error saving changes:', error);
            showToast.error('Error saving changes. Please try again.');
            progressCallbacks?.onComplete(false, []);
            return { success: false, newImages: [], failedUploads: this.failedUploads };
        } finally {
            this.isSaving = false;
        }
    }

    // Function to cancel the current upload operation
    cancelUpload(): void {
        this.isCanceled = true;
    }

    // Helper function to format file size
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Update upload speed calculation
    private updateUploadSpeed(): void {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.uploadStartTime) / 1000;

        if (elapsedSeconds > 0) {
            this.uploadSpeed = this.uploadedFileSizeBytes / elapsedSeconds;
        }
    }

    // Get current upload speed
    private getUploadSpeed(): number {
        return this.uploadSpeed;
    }

    // Get if currently saving
    isSavingImages(): boolean {
        return this.isSaving;
    }

    // Private upload speed tracking
    private uploadSpeed = 0;
}
