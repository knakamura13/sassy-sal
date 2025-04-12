import { defineConfig } from 'sanity';
import { deskTool } from '@sanity/desk-tool';
import { visionTool } from '@sanity/vision';
import schemas from './schemas';

// Read environment variables
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';

export default defineConfig({
    name: 'sassy-sal-studio',
    title: 'Photography Portfolio Studio',
    projectId,
    dataset,
    plugins: [deskTool(), visionTool()],
    schema: {
        types: schemas
    },
    basePath: ''
});
