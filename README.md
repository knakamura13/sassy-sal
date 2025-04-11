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
-   Secure admin authentication
    -   Server-side password verification
    -   Password reset via email
    -   Secure HTTP-only cookie session management

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

Set up environment variables (.env file):

```
# Sanity.io Configuration
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-api-token

# Admin Authentication
ADMIN_PASSWORD_HASH=your-bcrypt-password-hash
ADMIN_RECOVERY_EMAIL=your-recovery-email@example.com

# Email Configuration (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com
PUBLIC_SITE_URL=https://your-site-url.com
```

Generate a secure password hash:

```
node scripts/generate-password-hash.js
```

Run the app in development mode:

```
yarn run dev
```

Access the admin panel via `/admin` route.

## Admin Authentication

The admin authentication system is designed to be simple yet secure for a single-user scenario:

1. **Password Storage**: 
   - Passwords are stored as bcrypt hashes in environment variables
   - Authentication happens server-side for security
   - Session maintained via HTTP-only cookies

2. **Password Reset**:
   - Recovery email configured in environment variables
   - Reset tokens sent via email (configured SMTP server)
   - Reset links valid for 1 hour

3. **Development Mode**:
   - Default password is "password" if no hash is configured
   - Reset tokens printed to console in development

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
- [ ] N/A

**Features**
- [ ] Add a large nav link at bottom-right of each Gallery to send user to the next category's gallery, with right-caret icon (query all categories and search for the next category based on their `order` fields)
- [ ] Enable re-arranging images by drag-and-drop
- [x] Implement secure admin authentication (done?)
  - [ ] Alternatively, implement authentication with Sanity, if possible

**Chores**
- [ ] Remove deprecated Category properties
    - Delete the `description` field and all references to `category.description`
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields and all references
