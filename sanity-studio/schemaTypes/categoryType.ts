export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      description: 'Name of the category',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      description: 'Order of the category in the gallery',
      type: 'number',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      description: 'Thumbnail image for the category',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'password',
      title: 'Password Protection',
      description: 'Set a password to protect this category. Leave empty for public access.',
      type: 'string',
      validation: (Rule: any) => Rule.min(6).warning('Password should be at least 6 characters long for security'),
    },
  ],
}
