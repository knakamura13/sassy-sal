# Photography Portfolio

A simple website builder for photographers, built with SvelteKit and PostgreSQL database.

## Features

-   Responsive home page with categories and image galleries
-   Dynamic category pages with custom routing (slug route)
-   PostgreSQL database backend (formerly Strapi CMS)
    -   Persistent storage of categories and images
    -   Simple REST API for data management
    -   File system-based image storage
    -   Direct REST API integration using `fetch`

## Prerequisites

-   Node.js >= 20
    -   Command: `nvm install 20; nvm use 20`
-   PostgreSQL database
    -   Self-hosted or on a service like Railway.app

## Getting started

Install the dependencies:

```
yarn install
```

Set up environment variables:

```
DATABASE_URL=postgres://username:password@host:port/database
STORAGE_PATH=/path/to/image/storage
```

Run the app in development mode:

```
yarn run dev
```

Access the admin panel via `/admin` route (password: `password`).

## Database Schema

**Categories Table**:
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  order INTEGER NOT NULL,
  thumbnail_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Images Table**:
```sql
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  order INTEGER NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Integration

This project uses a custom REST API built on top of PostgreSQL:

-   Categories: `/api/categories` endpoints for listing and managing categories
-   Images: `/api/images` endpoints for managing images
-   Upload: `/api/upload` endpoint for file uploads

The integration continues to use the native fetch API for better maintainability and direct control over API requests.

## Migration Plan: Strapi CMS to PostgreSQL

### Phase 1: Database Setup

1. **Set up PostgreSQL**
   - Create database schema with tables for categories and images
   - Implement proper indexing and constraints

2. **Create API Layer**
   - Build a minimal Express.js/Node.js API server
   - Implement CRUD endpoints for categories and images
   - Match existing Strapi API paths to minimize frontend changes

3. **Configure Image Storage**
   - Set up filesystem-based image storage
   - Create upload endpoints with proper validation

### Phase 2: Data Migration

1. **Export Data from Strapi**
   - Export categories and relationships
   - Download all media files

2. **Migration Scripts**
   - Create scripts to transform and load data into PostgreSQL
   - Map Strapi IDs to new database IDs
   - Copy media files to new storage location

3. **Validation**
   - Verify data integrity after migration
   - Test all relationships and file references

### Phase 3: Implementation

1. **Backend Implementation**
   - Build authentication middleware
   - Implement all required API endpoints
   - Add validation and error handling

2. **Frontend Updates**
   - Adjust API calls where necessary
   - Update image URL handling
   - Update admin panel to work with new backend

### Phase 4: Testing & Deployment

1. **Parallel Testing**
   - Run both systems side by side
   - Compare responses and performance

2. **End-to-End Testing**
   - Test full user journeys
   - Verify all admin functionality

3. **Deployment**
   - Deploy PostgreSQL database
   - Deploy API server
   - Update environment variables
   - Complete switch after validation

4. **Cleanup**
   - Remove Strapi dependencies and code
   - Update documentation
   - Remove unused environment variables

## TODO Checklist

**Migration Tasks**
- [ ] Set up PostgreSQL database schema
- [ ] Create Express.js API server
- [ ] Implement categories endpoints
- [ ] Implement images endpoints
- [ ] Implement file upload system
- [ ] Create data migration scripts
- [ ] Export Strapi data and import to PostgreSQL
- [ ] Update frontend API calls
- [ ] Implement simple authentication
- [ ] Test all functionality end-to-end
- [ ] Deploy and validate
- [ ] Remove Strapi dependencies

**Bug Fixes**
- [ ] Fix editing category thumbnail image files
- [ ] Fix rearranging via drag-and-drop causing category `order` attributes to become out of sync
- [ ] Fix editing image files

**Features**
- [ ] Enable re-arranging images by drag-and-drop
- [ ] Implement simple username/password authentication

**Chores**
- [ ] Remove deprecated Category properties
    - Delete the `description` field and all references to `category.description`
    - Create a single `id` field in the new schema to eliminate confusion
- [ ] Remove deprecated Image properties
    - Delete the `title` and `description` fields and all references
    - Create a single `id` field in the new schema to eliminate confusion