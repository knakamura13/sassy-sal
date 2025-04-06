# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Strapi CMS.

## Features

-   Responsive home page with categories and image galleries
-   Dynamic category pages with custom routing
-   Interactive image preview modal with keyboard navigation
-   Sticky header with smooth height transition on scroll
-   Admin mode for content management
    -   Secure authentication system
    -   Image uploading via drag-and-drop
    -   Category creation and management
    -   Image organization across categories
-   Accessibility optimized components
-   Modern UI with responsive design
-   Strapi CMS backend integration
    -   Persistent storage of categories and images
    -   Content management through Strapi admin panel
    -   Image uploads and storage via Strapi Media Library
    -   Direct REST API integration using fetch

## Prerequisites

-   Node.js >= 20
    -   Command: `nvm install 20; nvm use 20`
-   Strapi CMS instance (v4.x)
    -   Self-hosted or cloud-hosted like Railway.app

## What's included?

-   SvelteKit with Tailwind CSS
-   Category-based image organization
-   Image preview functionality
-   Admin panel with content management
-   Responsive layout with smooth transitions
-   Mock authentication system
-   Strapi integration for backend storage

## Getting started

Install the dependencies:

```
yarn install
```

Set up environment variables:

```
STRAPI_API_URL=https://your-strapi-instance.railway.app
```

Run the app in development mode:

```
yarn run dev
```

Access the admin panel via `/admin` route (password: `admin123`).

## Strapi Setup

1. Create a Strapi instance with the following content types:

    **Category**:

    - name: String (required)
    - slug: String (required, unique)
    - description: Text (optional)
    - thumbnail: Media (single image)
    - images: Relation to Images collection (one-to-many)

    **Image**:

    - title: String (required)
    - description: Text (optional)
    - image: Media (single image, required)
    - category: Relation to Category (many-to-one)

2. Set up proper permissions in Strapi admin panel to allow public access to categories and images

## Strapi API Integration

This project uses direct REST API calls to communicate with the Strapi backend:

-   Categories: `/api/categories` endpoints for listing and managing categories
-   Images: `/api/images` endpoints for managing images
-   Upload: `/api/upload` endpoint for file uploads

The integration is built using the native fetch API instead of a Strapi client library for better maintainability and direct control over API requests.

## Future Enhancements (Stage 3)

-   Image metadata editing
-   Multiple galleries/collections
-   User authentication improvements
-   Custom image processing and optimization

## TODO Checklist

-   [ ] Quick Wins

    -   [ ] Add contact nav button to header
    -   [ ] Fix Strapi category thumbnails loading issue

-   [ ] Medium Effort

    -   [ ] Implement Shad-cn Dialog for New Category form

-   [ ] Major Updates

    -   [ ] Integrate Shad-cn Form component (`yarn dlx shadcn-svelte@latest add form`)
    -   [ ] Replace UI elements with Shad-cn components (buttons, dialogs, forms, etc.)
    -   [ ] Enable multiple image uploads via button or drag-and-drop
