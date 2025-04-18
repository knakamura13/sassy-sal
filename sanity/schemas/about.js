export default {
    name: 'about',
    title: 'About Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'mainContent',
            title: 'Main Content',
            type: 'array',
            of: [{ type: 'block' }],
            validation: (Rule) => Rule.required()
        },
        {
            name: 'mission',
            title: 'Mission Statement',
            type: 'text'
        },
        {
            name: 'teamIntro',
            title: 'Team Introduction',
            type: 'text'
        },
        {
            name: 'teamMembers',
            title: 'Team Members',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'name',
                            title: 'Name',
                            type: 'string'
                        },
                        {
                            name: 'role',
                            title: 'Role',
                            type: 'string'
                        },
                        {
                            name: 'bio',
                            title: 'Bio',
                            type: 'text'
                        },
                        {
                            name: 'photo',
                            title: 'Photo',
                            type: 'image',
                            options: {
                                hotspot: true
                            }
                        }
                    ]
                }
            ]
        }
    ]
};
