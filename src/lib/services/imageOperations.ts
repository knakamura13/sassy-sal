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
            const { addImage, deleteImage, updateImage } = await import('$lib/services/sanity/imageService');

            // Process deletions first
            if (imagesToRemove.length > 0) {
                progressCallbacks?.onProgress(uploadStep, uploadTotal, 0, 'Deleting images...', 'Deleting');

                const deletionPromises = imagesToRemove.map(async (image) => {
                    if (this.isCanceled) return { status: 'skipped', image };

                    try {
                        await deleteImage(image.id);
                        cacheManager?.clearCachedImage(image.id);
                        return { status: 'fulfilled', image };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Error deleting image:', error);
                        return { status: 'rejected', image, reason: errorMessage };
                    }
                });

                const results = await Promise.allSettled(deletionPromises);

                results.forEach((result) => {
                    if (this.isCanceled) return;

                    if (
                        result.status === 'rejected' ||
                        (result.status === 'fulfilled' && result.value.status === 'rejected')
                    ) {
                        const image = result.status === 'fulfilled' ? result.value.image : (result as any).image;
                        const reason = result.status === 'fulfilled' ? result.value.reason : result.reason;
                        this.failedUploads.push({
                            image,
                            error: `Failed to delete: ${reason}`
                        });
                    }
                    uploadStep++;
                    const percentage = Math.round((uploadStep / uploadTotal) * 100);
                    progressCallbacks?.onProgress(
                        uploadStep,
                        uploadTotal,
                        percentage,
                        `Processed image deletions...`,
                        'Deleting'
                    );
                });
            }

            // Process additions
            if (imagesToAdd.length > 0 && !this.isCanceled) {
                progressCallbacks?.onProgress(
                    uploadStep,
                    uploadTotal,
                    Math.round((uploadStep / uploadTotal) * 100),
                    'Uploading new images...',
                    'Uploading'
                );

                const uploadPromises = imagesToAdd.map(async (image, i) => {
                    if (!image.file) {
                        return { status: 'skipped', image };
                    }

                    try {
                        const imageData = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0),
                            image: image.file,
                            category: categoryId
                        };

                        const fileSize = image.file.size;
                        const fileSizeFormatted = this.formatFileSize(fileSize);

                        // This progress update is for initiating the upload
                        progressCallbacks?.onProgress(
                            uploadStep + i,
                            uploadTotal,
                            Math.round(((uploadStep + i) / uploadTotal) * 100),
                            `Starting upload for image ${i + 1} of ${imagesToAdd.length} (${fileSizeFormatted})...`,
                            'Uploading'
                        );

                        const uploadResult = await addImage(imageData);

                        // Update stats upon successful upload
                        this.uploadedFileSizeBytes += fileSize;
                        this.updateUploadSpeed();
                        progressCallbacks?.onFileProgress(
                            this.uploadedFileSizeBytes,
                            this.totalFileSizeBytes,
                            this.getUploadSpeed()
                        );

                        if (uploadResult?.data?.id) {
                            const uploadedImage = {
                                ...image,
                                id: uploadResult.data.id,
                                url: image.url,
                                thumbnailUrl: image.thumbnailUrl || image.url,
                                fullSizeUrl: image.fullSizeUrl || image.url,
                                ...(useCdn && {
                                    cdnUrl: uploadResult.data.attributes?.image?.data?.attributes?.url
                                }),
                                uploadedAt: new Date().getTime(),
                                categoryId
                            };
                            if (useCdn) {
                                newlyUploadedImages.push(uploadedImage);
                            }
                        }

                        return { status: 'fulfilled', image };
                    } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                        console.error('Error adding image:', err);
                        return { status: 'rejected', image, reason: errorMessage };
                    }
                });

                const results = await Promise.allSettled(uploadPromises);

                results.forEach((result) => {
                    if (
                        result.status === 'rejected' ||
                        (result.status === 'fulfilled' && result.value.status === 'rejected')
                    ) {
                        const image = result.status === 'fulfilled' ? result.value.image : (result as any).image;
                        const reason = result.status === 'fulfilled' ? result.value.reason : result.reason;
                        this.failedUploads.push({
                            image,
                            error: `Failed to upload: ${reason}`
                        });
                    }
                    uploadStep++;
                    const percentage = Math.round((uploadStep / uploadTotal) * 100);
                    progressCallbacks?.onProgress(
                        uploadStep,
                        uploadTotal,
                        percentage,
                        `Processed image ${uploadStep} of ${uploadTotal}...`,
                        'Uploading'
                    );
                });
            }

            // Process updates
            if (imagesToUpdate.length > 0 && !this.isCanceled) {
                progressCallbacks?.onProgress(
                    uploadStep,
                    uploadTotal,
                    Math.round((uploadStep / uploadTotal) * 100),
                    'Updating images...',
                    'Updating'
                );

                const updatePromises = imagesToUpdate.map(async (image, i) => {
                    try {
                        const updateData: any = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0),
                            spanTwoColumns: image.spanTwoColumns
                        };

                        if (image.file) {
                            updateData.image = image.file;
                            const fileSize = image.file.size;
                            const fileSizeFormatted = this.formatFileSize(fileSize);

                            progressCallbacks?.onProgress(
                                uploadStep + i,
                                uploadTotal,
                                Math.round(((uploadStep + i) / uploadTotal) * 100),
                                `Updating image ${i + 1} of ${imagesToUpdate.length} with new file (${fileSizeFormatted})...`,
                                'Updating'
                            );

                            if (useCdn) {
                                const updatedImage = {
                                    ...image,
                                    url: URL.createObjectURL(image.file),
                                    thumbnailUrl: URL.createObjectURL(image.file),
                                    fullSizeUrl: URL.createObjectURL(image.file),
                                    updatedAt: new Date().getTime(),
                                    categoryId
                                };
                                newlyUploadedImages.push(updatedImage);
                            }
                        } else {
                            progressCallbacks?.onProgress(
                                uploadStep + i,
                                uploadTotal,
                                Math.round(((uploadStep + i) / uploadTotal) * 100),
                                `Updating image meta ${i + 1} of ${imagesToUpdate.length}...`,
                                'Updating'
                            );
                        }

                        await updateImage(image.id, updateData);

                        if (image.file) {
                            this.uploadedFileSizeBytes += image.file.size;
                            this.updateUploadSpeed();
                            progressCallbacks?.onFileProgress(
                                this.uploadedFileSizeBytes,
                                this.totalFileSizeBytes,
                                this.getUploadSpeed()
                            );
                        }

                        return { status: 'fulfilled', image };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Error updating image:', error);
                        return { status: 'rejected', image, reason: errorMessage };
                    }
                });

                const results = await Promise.allSettled(updatePromises);

                results.forEach((result) => {
                    if (
                        result.status === 'rejected' ||
                        (result.status === 'fulfilled' && result.value.status === 'rejected')
                    ) {
                        const image = result.status === 'fulfilled' ? result.value.image : (result as any).image;
                        const reason = result.status === 'fulfilled' ? result.value.reason : result.reason;
                        this.failedUploads.push({
                            image,
                            error: `Failed to update: ${reason}`
                        });
                    }
                    uploadStep++;
                    const percentage = Math.round((uploadStep / uploadTotal) * 100);
                    progressCallbacks?.onProgress(
                        uploadStep,
                        uploadTotal,
                        percentage,
                        `Processed image update ${uploadStep} of ${uploadTotal}...`,
                        'Updating'
                    );
                });
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
