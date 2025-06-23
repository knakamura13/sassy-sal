# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Sanity CMS.

## Features

- Responsive home page with categories and image galleries
- Dynamic category pages with custom routing (slug route)
- Modern UI with Tailwind CSS and Shadcn components
- Image management with upload functionality
- Optimistic UI updates for smoother user experience
- Sanity CMS backend integration
    - Type-safe content modeling with GROQ queries
    - Real-time content updates with @sanity/client
    - Image pipeline with hotspot handling and CDN optimization
    - Server-side and client-side Sanity clients
    - File drag-and-drop image uploads with custom Svelte components
- Admin features
    - Password-protected admin login
    - Category management interface
    - Category management with atomic updates
    - Optimistic UI updates with local state management
    - Client-side image uploads with progress indicators
    - Toast notifications for user feedback
- SEO optimized page structure
- About Me page
- API routes for backend functionality

## Prerequisites

- Node.js >= 20
    - Command: `nvm install 20; nvm use 20`
- Sanity.io account
    - Free tier available with 2 users, 100K API requests/month
    - No self-hosting required

## Getting started

Install the dependencies:

```
yarn install
```

Run the app in development mode:

```
yarn run dev
```

Build and run the app for production:

```
yarn start
```

## Sanity Studio

This project contains a Sanity Studio instance in the `sanity-studio` directory. The Studio manages the content schema definitions and provides a CMS interface.

To modify Sanity schemas:

1. Navigate to the `sanity-studio` directory:

    ```
    cd sanity-studio
    ```

2. Make your schema changes in the `schemaTypes` directory

3. Deploy your schema changes to Sanity:

    ```
    yarn run deploy
    ```

4. To run the Sanity Studio locally:
    ```
    cd sanity-studio
    yarn run dev
    ```

## Sanity Schema

**Category Schema**:

```javascript
// schemas/category.js
export default {
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            options: {
                hotspot: true
            }
        }
    ]
};
```

**Image Schema**:

```javascript
// schemas/image.js
export default {
    name: 'galleryImage',
    title: 'Gallery Image',
    type: 'document',
    fields: [
        {
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'image',
            title: 'Image',
            type: 'image',
            options: {
                hotspot: true
            },
            validation: (Rule) => Rule.required()
        },
        {
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: [{ type: 'category' }]
        }
    ]
};
```

## Future Features/Changes

- [ ] **About Me Page Redesign**
