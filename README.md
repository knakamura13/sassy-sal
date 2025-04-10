# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and Sanity CMS.

## Features

-   Responsive home page with categories and image galleries
-   Dynamic category pages with custom routing (slug route)
-   Sanity CMS backend (formerly Strapi CMS)
    -   Persistent storage of categories and images
    -   Content management through Sanity Studio
    -   Image uploads and transformations via Sanity's CDN
    -   Direct REST API integration using `fetch`

## Prerequisites

-   Node.js >= 20
    -   Command: `nvm install 20; nvm use 20`
-   Sanity.io account
    -   Free tier available with 2 users, 100K API requests/month
    -   No self-hosting required

## Getting started

Install the dependencies:

```
yarn install
```

Set up environment variables:

```
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-api-token
```

Run the app in development mode:

```
yarn run dev
```

Access the admin panel via `/admin` route (password: `password`).

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
      validation: Rule => Rule.required()
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: Rule => Rule.required()
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
}
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
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}]
    }
  ]
}
```

## API Integration

This project uses Sanity's Content API to fetch and manage content:

-   Categories: GROQ queries to fetch and manage categories
-   Images: GROQ queries to fetch and manage images
-   Asset Management: Sanity's Asset Pipeline for image uploads

The integration will use the Sanity JavaScript client for optimized queries and type safety.

## TODO Checklist

**Bug Fixes**
- [ ] Fix editing category thumbnail image files
- [ ] Fix rearranging via drag-and-drop causing category `order` attributes to become out of sync
- [ ] Fix editing image files

**Features**
- [ ] Enable re-arranging images by drag-and-drop
- [ ] Implement authentication with Sanity
- [ ] Implement authentication with Sanity

**Chores**
- [ ] Remove deprecated Category properties
    - Delete the `description` field and all references to `category.description`
    - Ensure clean ID handling with Sanity document IDs
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields and all references
    - Ensure clean ID handling with Sanity document IDs