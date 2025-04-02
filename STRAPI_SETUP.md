# Strapi Setup Guide

This guide will help you set up the required content types and configurations in your Strapi instance for the photography portfolio.

## Content Types

### Category

Create a "Category" collection type with the following fields:

-   **name** (Text, required): The display name of the category
-   **slug** (Text, required, unique): URL-friendly identifier
-   **description** (Text, long): Optional description of the category
-   **isVisible** (Boolean): Controls visibility on the homepage
-   **displayOrder** (Number): Controls the display order on the homepage
-   **thumbnail** (Media, single): Featured image for the category on the homepage
-   **images** (Relation, has many Images): Relationship to Image collection

### Image

Create an "Image" collection type with the following fields:

-   **title** (Text): Title of the image
-   **alt** (Text): Alternative text for accessibility
-   **description** (Text, long): Optional description of the image
-   **displayOrder** (Number): Controls the display order in the gallery
-   **image** (Media, single, required): The actual image file
-   **category** (Relation, belongs to Category): Relationship to Category collection

## API Configuration

1. Navigate to Settings → Roles → Public and enable the following permissions:

    - Category:

        - find
        - findOne

    - Image:

        - find
        - findOne

    - Upload:
        - find

2. Navigate to Settings → Roles → Authenticated and enable the following permissions:

    - Category:

        - find
        - findOne
        - create
        - update
        - delete

    - Image:

        - find
        - findOne
        - create
        - update
        - delete

    - Upload:
        - find
        - upload

## User Setup

1. Create an admin user:
    - Navigate to Content Manager → Users
    - Create a new user with:
        - Email: admin@example.com (or your preferred email)
        - Password: Choose a strong password
        - Role: Authenticated

## Testing Your Setup

After setting up your content types:

1. Create a few test categories
2. Upload some images to each category
3. Test the API endpoints:
    - `GET /api/categories?populate=thumbnail`
    - `GET /api/categories/{id}?populate=images.image`

## Environment Configuration

Make sure your SvelteKit project's `.env` file contains the correct Strapi URL:

```
VITE_STRAPI_URL=https://your-strapi-instance.railway.app
```
