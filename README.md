# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Sanity CMS.

## Features

- Responsive home page with categories and image galleries
- Dynamic category pages with custom routing (slug route)
- Sanity CMS backend (formerly Strapi CMS)
    - Persistent storage of categories and images
    - Content management through Sanity Studio
    - Image uploads and transformations via Sanity's CDN
    - Direct REST API integration using `fetch`
- Secure admin authentication
    - Server-side password verification
    - Secure HTTP-only cookie session management

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

## API Integration

This project uses Sanity's Content API to fetch and manage content:

- Categories: GROQ queries to fetch and manage categories
- Images: GROQ queries to fetch and manage images
- Asset Management: Sanity's Asset Pipeline for image uploads

The integration will use the Sanity JavaScript client for optimized queries and type safety.

## TODO Checklist

**Bug Fixes**

- [ ] N/A

**Features**

- [ ] Enable re-arranging images in the Gallery by drag-and-drop

**Chores**

- [ ] Remove deprecated Category properties
    - Delete the `description` field and all references to `category.description`
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields and all references
