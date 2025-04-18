export default {
    name: 'pricing',
    title: 'Pricing Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'introText',
            title: 'Introduction Text',
            type: 'text',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'pricingTiers',
            title: 'Pricing Tiers',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'name',
                            title: 'Tier Name',
                            type: 'string',
                            validation: (Rule) => Rule.required()
                        },
                        {
                            name: 'price',
                            title: 'Price',
                            type: 'string',
                            validation: (Rule) => Rule.required()
                        },
                        {
                            name: 'description',
                            title: 'Description',
                            type: 'text'
                        },
                        {
                            name: 'features',
                            title: 'Features',
                            type: 'array',
                            of: [{ type: 'string' }]
                        },
                        {
                            name: 'isPopular',
                            title: 'Is Popular',
                            type: 'boolean',
                            initialValue: false
                        }
                    ]
                }
            ],
            validation: (Rule) => Rule.required()
        },
        {
            name: 'additionalServices',
            title: 'Additional Services',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'name',
                            title: 'Service Name',
                            type: 'string'
                        },
                        {
                            name: 'price',
                            title: 'Price',
                            type: 'string'
                        },
                        {
                            name: 'description',
                            title: 'Description',
                            type: 'text'
                        }
                    ]
                }
            ]
        },
        {
            name: 'faq',
            title: 'Pricing FAQ',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'question',
                            title: 'Question',
                            type: 'string'
                        },
                        {
                            name: 'answer',
                            title: 'Answer',
                            type: 'text'
                        }
                    ]
                }
            ]
        }
    ]
};
