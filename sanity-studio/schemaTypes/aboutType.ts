export default {
  name: 'about',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      description: 'The title of the about page',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
        name: 'photographerImage',
        title: 'Photographer Image',
        description: 'The image of the photographer',
        type: 'image',
        options: {
            hotspot: true
        }
    },
    {
      name: 'mainContent',
      title: 'Main Content',
      description: 'The main content of the about page',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'myApproach',
      title: 'My Approach Section',
      description: 'The My Approach section of the about page',
      type: 'object',
      fields: [
        {
          name: 'sectionTitle',
          title: 'Section Title',
          description: 'The title of the approach section (e.g. "My Approach")',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'columns',
          title: 'Approach Columns',
          description: 'The columns of the approach section',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              {
                name: 'icon',
                title: 'Column Icon',
                description: 'The icon for this approach column',
                type: 'image',
                options: {
                  hotspot: true
                }
              },
              {
                name: 'title',
                title: 'Column Title',
                description: 'Title for this approach column',
                type: 'string',
                validation: (Rule: any) => Rule.required()
              },
              {
                name: 'description',
                title: 'Column Description',
                description: 'Short description for this approach',
                type: 'text',
                validation: (Rule: any) => Rule.required()
              }
            ],
            preview: {
              select: {
                title: 'title',
                media: 'icon'
              }
            }
          }],
          validation: (Rule: any) => Rule.required().min(2).max(3).error('You must have 2 or 3 approach columns')
        }
      ]
    },
  ],
}
