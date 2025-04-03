<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { uploadFile, addImage } from '$lib/services/strapi';

    // The category ID is required for associating the image
    export let categoryId: number;

    // Define interface for Strapi uploaded file
    interface StrapiUploadedFile {
        id: number;
        name: string;
        url: string;
        // Other properties not needed for this component
    }

    const dispatch = createEventDispatcher<{ imageAdded: any }>();

    let showForm = false;
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let debugInfo = '';

    // Generate a random title based on filename and random number
    function generateImageTitle(filename: string): string {
        // Remove file extension and clean up filename
        const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        // Add a random number to ensure uniqueness
        const randomSuffix = Math.floor(Math.random() * 10000);
        return `${baseName}_${randomSuffix}`;
    }

    function resetForm() {
        showForm = false;
        selectedFile = null;
        imagePreview = '';
        errorMessage = '';
        debugInfo = '';
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedFile = input.files[0];

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(selectedFile);
        }
    }

    async function handleSubmit() {
        if (!selectedFile) {
            errorMessage = 'Please select an image file';
            return;
        }

        if (!categoryId || categoryId < 0) {
            errorMessage = 'Invalid category ID. Please refresh the page and try again.';
            debugInfo = `Category ID: ${categoryId}`;
            return;
        }

        // Log the category ID for debugging
        console.log(`🔍 Uploading image for category ID: ${categoryId}`);

        errorMessage = '';
        debugInfo = '';
        isUploading = true;

        try {
            debugInfo = 'Uploading file to Strapi Media Library...';
            // 1. Upload the file to Strapi Media Library
            const uploadedFile = (await uploadFile(selectedFile)) as StrapiUploadedFile;

            if (!uploadedFile || typeof uploadedFile.id !== 'number') {
                throw new Error('Failed to get valid file upload response from Strapi');
            }

            debugInfo = `File uploaded successfully. File ID: ${uploadedFile.id}`;

            // Generate title based on filename
            const autoTitle = generateImageTitle(selectedFile.name);

            // 2. Create the image record and associate it with the category using Strapi v4 relationship format
            const imageData = {
                title: autoTitle,
                description: '', // Empty description
                categories: {
                    connect: [{ id: categoryId }]
                },
                image: uploadedFile.id
            };

            debugInfo = `Creating image record with data: ${JSON.stringify(imageData)}`;
            console.log(`📤 Sending image data with categories connect: ${JSON.stringify(imageData)}`);

            const savedImage = await addImage(imageData);
            debugInfo = 'Image saved successfully';
            console.log(`✅ Image saved with ID: ${savedImage.id}, associated with category: ${categoryId}`);

            // Dispatch event so parent can update the UI
            dispatch('imageAdded', savedImage);

            resetForm();
        } catch (error) {
            console.error('Error uploading image:', error);
            errorMessage = 'Failed to upload image. Please try again.';
            debugInfo = error instanceof Error ? error.message : String(error);
        } finally {
            isUploading = false;
        }
    }
</script>

<div class="image-upload-placeholder aspect-square w-full">
    {#if showForm}
        <div class="h-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col">
            <h3 class="text-lg font-medium mb-4">Add New Image</h3>

            {#if errorMessage}
                <div class="mb-3 p-2 bg-red-100 text-red-700 rounded">
                    <p>{errorMessage}</p>
                    {#if debugInfo}
                        <details class="mt-2 text-xs">
                            <summary>Technical details</summary>
                            <pre class="p-2 bg-red-50 mt-1 overflow-auto">{debugInfo}</pre>
                        </details>
                    {/if}
                </div>
            {/if}

            <div class="mb-3">
                <label class="block text-sm font-medium mb-1" for="imageFile">Select Image File*</label>
                <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    on:change={handleFileChange}
                    required
                />
                {#if imagePreview}
                    <div class="mt-2 w-full h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        <img src={imagePreview} alt="Preview" class="h-full w-auto object-cover" />
                    </div>
                {/if}
            </div>

            <div class="mt-auto flex space-x-2">
                <button
                    class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-gray-400"
                    on:click={handleSubmit}
                    disabled={isUploading || !selectedFile}
                >
                    {#if isUploading}
                        Uploading...
                    {:else}
                        Upload Image
                    {/if}
                </button>
                <button
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded disabled:bg-gray-100"
                    on:click={resetForm}
                    disabled={isUploading}
                >
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <button
            class="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors"
            on:click={() => (showForm = true)}
        >
            <div class="text-5xl text-gray-400 mb-2">+</div>
            <div class="text-gray-500 font-medium">Add Image</div>
        </button>
    {/if}
</div>
