# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Strapi CMS.

## Features

-   Responsive home page with categories and image galleries
-   Dynamic category pages with custom routing (slug route)
-   Strapi CMS backend integration
    -   Persistent storage of categories and images
    -   Content management through Strapi admin panel
    -   Image uploads and storage via Strapi Media Library
    -   Direct REST API integration using `fetch`

## Prerequisites

-   Node.js >= 20
    -   Command: `nvm install 20; nvm use 20`
-   Strapi CMS instance (v5.x)
    -   Self-hosted on a service like Railway.app

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

Access the admin panel via `/admin` route (password: `password`).

## Strapi Content Types

**Category**:

- name: String (required)
- order: Number (required)
- thumbnail: Media (single image, optional)
- images: Relation to Images collection (one-to-many, optional)

**Image**:

- order: Number (required)
- image: Media (single image, required)
- category: Relation to Category (many-to-one, optional)

## Strapi API Integration

This project uses direct REST API calls to communicate with the Strapi backend:

-   Categories: `/api/categories` endpoints for listing and managing categories
-   Images: `/api/images` endpoints for managing images
-   Upload: `/api/upload` endpoint for file uploads

The integration is built using the native fetch API instead of a Strapi client library for better maintainability and direct control over API requests.

## TODO Checklist

**Bug Fixes**
- [ ] Fix editing image files
    - After editing an image file and closing the edit dialog ("Update" button), the image in the gallery gets replaced with a non-existent image URL (404 error).
    - After saving the changes and reloading the page, the broken image returns to its original state before the edit was made, indicating that no changes were actually made in the Strapi backend.

**Features**
- [ ] Enable re-arranging images by drag-and-drop
- [ ] Authentication with username and password
    - Does Strapi have an authentication feature?
    - If not, could we use the existing PostgreSQL DB for authentication?
    - If not, which service would require the least maintenance (e.g., hard-coded username and password via `.env` variables)?

**Chores**
- [ ] Remove deprecated Category properties
    - Delete the `description` field from Strapi and all references to `category.description`
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields from Strapi and all references to `image.title` and `image.description`