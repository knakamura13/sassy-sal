<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';

    // Define Sanity Category type locally
    interface SanityCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            password?: string;
            thumbnail?: {
                data?: {
                    attributes?: {
                        url?: string;
                        placeholderUrl?: string;
                        thumbnailUrl?: string;
                        fullSizeUrl?: string;
                        width?: number;
                        height?: number;
                    };
                };
            };
        };
    }

    const dispatch = createEventDispatcher<{
        update: { id: string | number; data: any };
    }>();

    export let open = false;
    export let category: SanityCategory;
    export let currentDisplayedUrl = '';

    // Edit dialog state
    let editName = '';
    let editOrder = 0;
    let editPassword = '';
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Ensure we have default values for missing properties
    $: categoryId = category?.id || 'placeholder';
    $: categoryName = category?.attributes?.name || 'Missing Category';
    $: categoryOrder = category?.attributes?.order ?? 0;

    // Initialize form when dialog opens
    $: if (open) {
        editName = categoryName;
        editOrder = categoryOrder;
        editPassword = category.attributes.password || '';
        imagePreview = currentDisplayedUrl || '';
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            processFile(input.files[0]);
        }
    }

    function processFile(file: File) {
        selectedFile = file;

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
    }

    function handleDropZoneClick() {
        fileInput.click();
    }

    // Common handler for drag events
    function handleDragEvent(event: DragEvent, entering: boolean) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = entering;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }

    function resetForm() {
        editName = categoryName;
        editOrder = categoryOrder;
        editPassword = category.attributes.password || '';
        selectedFile = null;
        imagePreview = currentDisplayedUrl;
        isUploading = false;
        errorMessage = '';
        isDragging = false;
    }

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    async function handleSubmit() {
        if (!editName.trim()) {
            showToast.error('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the update data
            const updateData: { data: { name: string; order: number; password?: string; thumbnail?: File } } = {
                data: {
                    name: editName.trim(),
                    order: Number(editOrder) || 0,
                    password: editPassword.trim() || undefined
                }
            };

            // Add thumbnail file if selected
            if (selectedFile) {
                updateData.data.thumbnail = selectedFile;
            }

            // Store old name to check if name changed
            const oldName = categoryName;

            // Dispatch the update event
            dispatch('update', {
                id: categoryId,
                data: updateData
            });

            // Update local state to reflect changes (via reactive declarations)
            if (category && category.attributes) {
                category.attributes.name = editName.trim();
                category.attributes.order = Number(editOrder) || 0;
            }

            // Close dialog after successful submission
            open = false;

            // Prevent immediate navigation if name changed to give Sanity time to update
            if (oldName !== editName.trim()) {
                showToast.success('Category updated. Refreshing page in 2 seconds...');
                setTimeout(() => {
                    window.location.href = window.location.href;
                }, 2000);
            }
        } catch (error: any) {
            // Handle specific error types
            if (error?.status === 404 || (typeof error?.message === 'string' && error.message.includes('404'))) {
                errorMessage = 'This category no longer exists. It may have been deleted from the server.';
            } else {
                errorMessage = `Failed to update category: ${error?.message || 'Unknown error'}`;
            }
            console.error('Error updating category:', error);
        } finally {
            isUploading = false;
        }
    }
</script>

<Dialog bind:open maxWidth="lg">
    <svelte:fragment slot="title">Edit Category</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="category-name">Name</Label>
            <Input id="category-name" type="text" bind:value={editName} placeholder="Category name" required />
        </div>

        <div class="space-y-2">
            <Label for="category-order">Order</Label>
            <Input id="category-order" type="number" bind:value={editOrder} placeholder="Display order" min="0" />
        </div>

        <div class="space-y-2">
            <Label for="category-password">Password Protection</Label>
            <Input
                id="category-password"
                type="password"
                bind:value={editPassword}
                placeholder="Set password (leave empty for public access)"
            />
            <p class="text-xs text-gray-500">
                Leave empty to make the category publicly accessible, or set a password to protect it.
            </p>
        </div>

        <div class="space-y-2">
            <Label>Thumbnail</Label>
            <div
                class="relative min-h-[150px] cursor-pointer rounded border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400"
                class:border-indigo-400={isDragging}
                on:click={handleDropZoneClick}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleDropZoneClick() : null)}
                on:dragenter={(e) => handleDragEvent(e, true)}
                on:dragover={(e) => handleDragEvent(e, true)}
                on:dragleave={(e) => handleDragEvent(e, false)}
                on:drop={handleDrop}
                tabindex="0"
                role="button"
                aria-label="Upload image"
            >
                <input type="file" bind:this={fileInput} class="hidden" accept="image/*" on:change={handleFileChange} />

                {#if imagePreview}
                    <img src={imagePreview} alt="Preview" class="mx-auto max-h-[200px] object-contain" />
                    <p class="mt-2 text-center text-sm text-gray-500">Click or drag to change the image</p>
                {:else}
                    <div class="text-center">
                        <svg
                            class="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                        <p class="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p class="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                {/if}
            </div>
        </div>

        {#if errorMessage}
            <div class="rounded bg-red-50 p-4 text-sm text-red-500">{errorMessage}</div>
        {/if}

        <div class="flex justify-end space-x-2">
            <Button type="button" variant="outline" on:click={() => (open = false)} disabled={isUploading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
                {#if isUploading}
                    <svg
                        class="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Saving...
                {:else}
                    Save Changes
                {/if}
            </Button>
        </div>
    </form>
</Dialog>
