export default {
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required()
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
};
