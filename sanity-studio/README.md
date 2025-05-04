# Studio Sally Photography - Sanity Studio

This is the Sanity Studio for the Studio Sally Photography website. It provides a content management system (CMS) for managing the website's content.

## Getting Started

### Prerequisites

- Node.js
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install
```

## Development

```bash
# Run the development server
yarn run dev
```

This will start the Sanity Studio locally at http://localhost:3333.

## Content Structure

The website content is organized into several schema types:

- **About Me**: Information about the photographer and contact information
- **Gallery**: Photo gallery organized by categories

## Making Changes

### Editing Schemas

Schema definitions are located in the `schemaTypes/` directory. Each schema type has its own file:

- `aboutType.ts` - About Me page schema
- `categoryType.ts` - Gallery category schema
- `galleryImageType.ts` - Gallery image schema

To modify a schema:

1. Edit the corresponding schema file in the `schemaTypes/` directory
2. Run the development server to test your changes
3. Deploy the changes when ready

### Adding New Schema Types

If adding a new schema type:

1. Create a new file in `schemaTypes/`
2. Add the schema to the exported array in `schemaTypes/index.ts`

## Deployment

To deploy changes to the Sanity Studio:

```bash
# Build and deploy the studio
yarn run deploy
```

This will deploy your Sanity Studio to https://sallyjkphotography.sanity.studio/

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Content Lake API Documentation](https://www.sanity.io/docs/content-lake-api)
- [Sanity Slack Community](https://slack.sanity.io/)
