export default {
    name: 'pricing',
    title: 'Pricing Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            description: 'Main title of the pricing page',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'introText',
            title: 'Introduction Text',
            description: 'Introductory text explaining the pricing packages',
            type: 'text',
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'pricingTiers',
            title: 'Pricing Tiers',
            description: 'The different photography packages offered',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'name',
                            title: 'Tier Name',
                            description: 'Name of the package (e.g., Basic, Standard, Premium)',
                            type: 'string',
                            validation: (Rule: any) => Rule.required()
                        },
                        {
                            name: 'price',
                            title: 'Price',
                            description: 'Price for the package (e.g., $300)',
                            type: 'string',
                            validation: (Rule: any) => Rule.required()
                        },
                        {
                            name: 'sessionDetails',
                            title: 'Session Details',
                            description: 'Details about the session (e.g., "1 hour • 20 edited digital photos")',
                            type: 'string',
                            validation: (Rule: any) => Rule.required()
                        },
                        {
                            name: 'features',
                            title: 'Features',
                            description: 'List of features included in this package',
                            type: 'array',
                            of: [{ type: 'string' }],
                            validation: (Rule: any) => Rule.required()
                        }
                    ],
                    preview: {
                        select: {
                            title: 'name',
                            subtitle: 'price'
                        }
                    }
                }
            ],
            validation: (Rule: any) => Rule.required().min(1)
        },
        {
            name: 'customPackagesSection',
            title: 'Custom Packages Section',
            description: 'Section for custom photography packages',
            type: 'object',
            fields: [
                {
                    name: 'sectionTitle',
                    title: 'Section Title',
                    description: 'Title for the custom packages section',
                    type: 'string',
                    validation: (Rule: any) => Rule.required()
                },
                {
                    name: 'description',
                    title: 'Description',
                    description: 'Text explaining the custom packages',
                    type: 'text',
                    validation: (Rule: any) => Rule.required()
                },
                {
                    name: 'contactButtonText',
                    title: 'Contact Button Text',
                    description: 'Text for the contact button',
                    type: 'string',
                    validation: (Rule: any) => Rule.required()
                },
                {
                    name: 'contactButtonUrl',
                    title: 'Contact Button URL',
                    description: 'URL or link for the contact button',
                    type: 'string',
                    validation: (Rule: any) => Rule.required()
                }
            ]
        }
    ]
};
