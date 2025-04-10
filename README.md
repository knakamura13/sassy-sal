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

## Migration Plan: Strapi CMS to Sanity CMS

### Phase 1: Sanity Setup

1. **Set up Sanity Project**
   - [x] Create new Sanity project
   - [x] Configure project settings and access control
   - [x] Install Sanity CLI and initialize local studio

2. **Define Content Schema**
   - [x] Create schemas for categories and images
   - [x] Set up appropriate validation rules
   - [x] Configure relationships between content types

3. **Configure Sanity Studio**
   - [x] Customize Sanity Studio UI
   - [x] Set up desk structure for content management
   - [x] Configure image upload settings

### Phase 2: Data Migration

1. **Export Data from Strapi**
   - [x] Export categories and relationships
   - [x] Download all media files

2. **Migration Scripts**
   - [x] Create scripts to transform and load data into Sanity
   - [x] Map Strapi IDs to new Sanity document IDs
   - [x] Upload media files to Sanity asset store

3. **Validation**
   - [x] Verify data integrity after migration
   - [x] Test all relationships and image references

### Phase 3: Frontend Integration

1. **Install Sanity Client**
   - [x] Add Sanity JavaScript client to the project
   - [x] Configure API connectivity
   - [x] Create helper functions for common queries

2. **Frontend Updates**
   - [ ] Update API calls to use Sanity client
     - [x] Categories
       - [x] `getCategories`: Load categories with thumbnails
       - [x] `addCategory`: Create a new category (depends on `uploadFile`)
       - [x] `deleteCategory`: Delete a category
       - [x] `updateCategory`: Update an existing category's properties (name, order, thumbnail image file)
     - [ ] Gallery (category slug route)
       - [x] `getCategoryWithImages`: Load a specific category with all its images
       - [x] `addImage`: Add an image to a category (depends on `uploadFile`)
       - [x] `deleteImage`: Delete an image from a category
       - [ ] `updateImage`: Update an existing image's properties (order, image file)
   - [ ] Implement GROQ queries

3. **Admin Panel Updates**
   - [ ] Integrate with Sanity Studio or update custom admin panel
   - [ ] Implement authentication with Sanity

### Phase 4: Testing & Deployment

1. **Parallel Testing**
   - [ ] Run both systems side by side
   - [ ] Compare responses and performance

2. **End-to-End Testing**
   - [ ] Test full user journeys
   - [ ] Verify all admin functionality

3. **Deployment**
   - [x] Deploy Sanity Studio (automatic with Sanity)
   - [ ] Update environment variables in production
   - [ ] Complete switch after validation

4. **Cleanup**
   - [ ] Remove Strapi dependencies and code
   - [ ] Update documentation
   - [ ] Remove unused environment variables

## TODO Checklist

**Migration Tasks**
- [x] Set up Sanity project and account
- [x] Create Sanity content schemas
- [x] Configure Sanity Studio
- [x] Install Sanity client in SvelteKit project
- [x] Create data migration scripts
- [x] Export Strapi data and import to Sanity
- [x] Update API calls to use Sanity client
- [ ] Implement GROQ queries
- [ ] Update image URL handling
- [ ] Configure authentication
- [ ] Test all functionality end-to-end
- [ ] Deploy and validate
- [ ] Remove Strapi dependencies

**Bug Fixes**
- [ ] Fix editing category thumbnail image files
- [ ] Fix rearranging via drag-and-drop causing category `order` attributes to become out of sync
- [ ] Fix editing image files

**Features**
- [ ] Enable re-arranging images by drag-and-drop
- [ ] Implement authentication with Sanity

**Chores**
- [ ] Remove deprecated Category properties
    - Delete the `description` field and all references to `category.description`
    - Ensure clean ID handling with Sanity document IDs
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields and all references
    - Ensure clean ID handling with Sanity document IDs