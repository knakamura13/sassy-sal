<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import UploadProgressDialog from './UploadProgressDialog.svelte';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Upload progress state
    let showProgressDialog = false;
    let uploadStep = 0;
    let uploadTotal = 0;
    let uploadMessage = '';
    let uploadPercentage = 0;
    let uploadOperation = '';
    let totalFileSizeBytes = 0;
    let uploadedFileSizeBytes = 0;
    let uploadSpeed = 0;
    let isCanceled = false;

    // Upload progress callbacks that can be passed to ImageOperationsService
    export const progressCallbacks = {
        onProgress: (step: number, total: number, percentage: number, message: string, operation: string) => {
            uploadStep = step;
            uploadTotal = total;
            uploadPercentage = percentage;
            uploadMessage = message;
            uploadOperation = operation;
            showProgressDialog = total > 0;
        },
        onFileProgress: (uploadedBytes: number, totalBytes: number, speed: number) => {
            uploadedFileSizeBytes = uploadedBytes;
            totalFileSizeBytes = totalBytes;
            uploadSpeed = speed;
        },
        onComplete: async (success: boolean, newImages: any[]) => {
            // Keep the dialog visible for a moment so user can see completion
            if (success && !isCanceled) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            showProgressDialog = false;

            // Dispatch completion event to parent
            dispatch('uploadComplete', { success, newImages, isCanceled });
        },
        onCancel: () => {
            uploadMessage = 'Canceling upload process...';
            showProgressDialog = false;
            dispatch('uploadCanceled');
        }
    };

    // Function to handle cancel upload
    function cancelUpload() {
        isCanceled = true;
        dispatch('cancelUpload');
    }

    // Function to reset upload state
    export function resetUploadState() {
        showProgressDialog = false;
        uploadStep = 0;
        uploadTotal = 0;
        uploadMessage = '';
        uploadPercentage = 0;
        uploadOperation = '';
        totalFileSizeBytes = 0;
        uploadedFileSizeBytes = 0;
        uploadSpeed = 0;
        isCanceled = false;
    }

    // Function to start upload process
    export function startUpload() {
        isCanceled = false;
        resetUploadState();
    }
</script>

<UploadProgressDialog
    bind:show={showProgressDialog}
    {uploadOperation}
    {uploadMessage}
    {uploadStep}
    {uploadTotal}
    {uploadPercentage}
    {totalFileSizeBytes}
    {uploadedFileSizeBytes}
    {uploadSpeed}
    {isCanceled}
    on:cancel={cancelUpload}
/>
