export default {
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    {
      name: 'order',
      title: 'Order',
      description: 'Order of the image in the gallery',
      type: 'number',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      description: 'The image to be displayed in the gallery',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      description: 'The category the image belongs to',
      type: 'reference',
      to: [{type: 'category'}],
    },
  ],
}
