# Sanity Services - Modular Architecture

This directory contains the refactored Sanity services, split into focused modules for better maintainability and code organization.

## Structure

```
sanity/
├── README.md           # This file
├── index.ts           # Main entry point - re-exports all functionality
├── types.ts           # Shared TypeScript interfaces and types
├── client.ts          # Sanity client configuration and URL builder
├── transformers.ts    # Data transformation between Sanity and UI formats
├── categoryService.ts # Category CRUD operations
├── imageService.ts    # Image CRUD operations
└── uploadService.ts   # File upload with retry logic
```

## Modules

### `client.ts`

-   **Purpose**: Sanity client configuration and initialization
-   **Exports**: `client`, `urlFor`, `isBrowser`
-   **Responsibilities**:
    -   Environment detection (browser vs server)
    -   Client configuration with browser-specific options
    -   Image URL builder setup
    -   Browser polyfills for Node.js compatibility

### `types.ts`

-   **Purpose**: Shared TypeScript interfaces
-   **Exports**: All type definitions used across Sanity services
-   **Key Types**:
    -   `SanityCategory`, `SanityGalleryImage`, `SanityImage`
    -   `FormattedCategory`, `FormattedImage`
    -   `CategoryData`, `ImageData`

### `transformers.ts`

-   **Purpose**: Data transformation between Sanity's format and UI expectations
-   **Exports**: `transformCategory`, `transformCategoryWithImages`, `transformImage`, `createSanityImageFromAsset`
-   **Responsibilities**:
    -   Convert Sanity documents to UI-friendly formats
    -   Generate multiple image URL variants (thumbnail, medium, full)
    -   Handle error cases in URL generation

### `categoryService.ts`

-   **Purpose**: Category-related CRUD operations
-   **Exports**: `getCategories`, `getCategoryWithImages`, `addCategory`, `deleteCategory`, `updateCategory`
-   **Features**:
    -   GROQ queries for category data
    -   Progress callbacks for deletion operations
    -   Automatic image cleanup on category deletion

### `imageService.ts`

-   **Purpose**: Image-related CRUD operations
-   **Exports**: `addImage`, `deleteImage`, `updateImage`
-   **Features**:
    -   File upload integration
    -   Server-side operations via API endpoints
    -   Data transformation for UI consistency

### `uploadService.ts`

-   **Purpose**: File upload with network resilience
-   **Exports**: `uploadFile`
-   **Features**:
    -   Configurable retry logic for network errors
    -   Exponential backoff with jitter
    -   Timeout handling
    -   Progress tracking capabilities

### `index.ts`

-   **Purpose**: Main entry point for the Sanity services module
-   **Exports**: Re-exports all functionality from other modules
-   **Usage**: Import from this file to access any Sanity service functionality

## Usage Examples

### Basic Usage

```typescript
// Import from the main entry point (recommended)
import { getCategories, addImage, uploadFile } from '$lib/services/sanity';

// Or import specific modules for advanced use cases
import { client } from '$lib/services/sanity/client';
import { transformCategory } from '$lib/services/sanity/transformers';
```

### Category Operations

```typescript
import { getCategories, addCategory, deleteCategory } from '$lib/services/sanity';

// Get all categories
const categories = await getCategories();

// Add a new category
const newCategory = await addCategory({
    name: 'Portfolio',
    order: 1,
    thumbnail: file // File object
});

// Delete category with progress tracking
await deleteCategory(categoryId, (step, total, message) => {
    console.log(`${step}/${total}: ${message}`);
});
```

### Image Operations

```typescript
import { addImage, updateImage } from '$lib/services/sanity';

// Add image to category
const newImage = await addImage({
    image: file,
    order: 1,
    category: categoryId
});

// Update image order
await updateImage(imageId, { order: 2 });
```

### File Uploads

```typescript
import { uploadFile } from '$lib/services/sanity';

// Upload with automatic retry on network errors
const asset = await uploadFile(file);
console.log('Uploaded asset ID:', asset._id);
```

## Benefits of Modular Structure

1. **Focused modules**: Each file has a single responsibility
2. **Better maintainability**: Easier to locate and modify specific functionality
3. **Improved testing**: Smaller modules are easier to unit test
4. **Type safety**: Centralized type definitions reduce duplication
5. **Code reusability**: Transformers and utilities can be used independently

## Error Handling

All services include comprehensive error handling:

-   Network errors are logged with context
-   Retry logic for transient failures
-   Graceful degradation for missing data
-   User-friendly error messages

## Performance Considerations

-   Client configuration optimized for browser vs server environments
-   CDN usage when available
-   Batch operations for bulk deletions
-   Lazy loading of retry configuration
