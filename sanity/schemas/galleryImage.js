export default {
    name: 'galleryImage',
    title: 'Gallery Image',
    type: 'document',
    fields: [
        {
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'image',
            title: 'Image',
            type: 'image',
            options: {
                hotspot: true
            },
            validation: (Rule) => Rule.required()
        },
        {
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: [{ type: 'category' }]
        }
    ]
};
