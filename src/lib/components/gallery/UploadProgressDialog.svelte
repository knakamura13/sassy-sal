<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Alert from '$lib/components/ui/alert';
    import * as Progress from '$lib/components/ui/progress';

    const dispatch = createEventDispatcher();

    // Props
    export let show = false;
    export let uploadOperation = '';
    export let uploadMessage = '';
    export let uploadStep = 0;
    export let uploadTotal = 0;
    export let uploadPercentage = 0;
    export let totalFileSizeBytes = 0;
    export let uploadedFileSizeBytes = 0;
    export let uploadSpeed = 0;
    export let isCanceled = false;

    // Simple moving average of the last 10 upload speeds
    let uploadSpeeds: number[] = [];
    $: SMA = uploadSpeeds.length
        ? uploadSpeeds.slice(-10).reduce((sum, speed) => sum + speed, 0) / uploadSpeeds.slice(-10).length
        : 0;

    // Helper function to format file size
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Helper function to format upload speed
    function formatSpeed(bytesPerSecond: number): string {
        if (bytesPerSecond === 0) return '0 KB/s';

        if (bytesPerSecond < 1024) {
            return bytesPerSecond.toFixed(1) + ' B/s';
        } else if (bytesPerSecond < 1048576) {
            return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
        }

        return (bytesPerSecond / 1048576).toFixed(1) + ' MB/s';
    }

    // Helper function to format remaining time
    function formatTimeRemaining(seconds: number): string {
        if (!isFinite(seconds) || seconds <= 0) {
            return 'Almost done...';
        }

        if (seconds < 60) {
            return `${Math.ceil(seconds)} seconds`;
        } else if (seconds < 3600) {
            return `${Math.ceil(seconds / 60)} minutes`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.ceil((seconds % 3600) / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    // Function to handle cancel upload
    function handleCancel() {
        dispatch('cancel');
    }

    // Update upload speeds when uploadSpeed changes
    $: if (uploadSpeed > 0) {
        uploadSpeeds = [...uploadSpeeds, uploadSpeed];
    }
</script>

<AlertDialog.Root bind:open={show}>
    <AlertDialog.Content class="sm:max-w-md">
        <AlertDialog.Header>
            <AlertDialog.Title>{uploadOperation} Images</AlertDialog.Title>
            <AlertDialog.Description>
                <div class="space-y-4">
                    <Alert.Alert>
                        <Alert.AlertDescription>
                            {uploadMessage}
                        </Alert.AlertDescription>
                    </Alert.Alert>

                    <div class="flex flex-col space-y-1.5">
                        <div class="flex justify-between text-sm font-medium">
                            <span>Progress</span>
                            <span>{uploadStep} of {uploadTotal} items</span>
                        </div>
                        <Progress.Progress value={uploadPercentage} class="h-2" />
                        <div class="mt-1 flex justify-between text-sm text-muted-foreground">
                            <span>{uploadPercentage}%</span>
                            {#if totalFileSizeBytes > 0}
                                <span
                                    >{formatFileSize(uploadedFileSizeBytes)} of {formatFileSize(
                                        totalFileSizeBytes
                                    )}</span
                                >
                            {/if}
                        </div>
                    </div>

                    {#if uploadSpeed > 0}
                        <div class="mt-2 text-center text-sm text-muted-foreground">
                            <div class="flex items-center justify-center gap-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg
                                >
                                Upload speed: {formatSpeed(SMA)}
                            </div>
                            <div class="mt-1 text-xs">
                                Estimated time remaining: {uploadSpeed > 0
                                    ? formatTimeRemaining((totalFileSizeBytes - uploadedFileSizeBytes) / SMA)
                                    : 'Calculating...'}
                            </div>
                        </div>
                    {/if}
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel on:click={handleCancel} disabled={isCanceled || uploadPercentage === 100}>
                Cancel
            </AlertDialog.Cancel>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
