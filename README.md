# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Strapi CMS.

## Features

-   Responsive home page with categories and image galleries
-   Dynamic category pages with custom routing
-   Interactive image preview modal with keyboard navigation
-   Sticky header with smooth height transition on scroll
-   Admin mode for content management
    -   Secure authentication system through Strapi
    -   Image uploading via drag-and-drop
    -   Category creation and management
    -   Image organization across categories
-   Accessibility optimized components
-   Modern UI with responsive design

## Prerequisites

-   Node.js >= 20
    -   Command: `nvm install 20; nvm use 20`
-   Strapi CMS instance (self-hosted or on Railway.app)

## What's included?

-   SvelteKit with Tailwind CSS
-   Category-based image organization
-   Image preview functionality
-   Admin panel with content management
-   Responsive layout with smooth transitions
-   Strapi CMS integration

## Getting started

1. Install the dependencies:

```
yarn install
```

2. Set up your Strapi instance following the instructions in STRAPI_SETUP.md

3. Update the `.env` file with your Strapi instance URL:

```
VITE_STRAPI_URL=https://your-strapi-instance.railway.app
```

4. Run the app in development mode:

```
yarn run dev
```

5. Access the admin panel via `/admin` route and login with your Strapi credentials.

## Backend Integration

This project uses Strapi CMS as a backend for:

-   Storing category data
-   Managing image uploads
-   User authentication
-   Content management

See STRAPI_SETUP.md for detailed setup instructions.
