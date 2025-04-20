import { client } from '$lib/sanity';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch pricing page data from Sanity
    const pricing = await client.fetch(`*[_type == "pricing"][0]`);

    console.log(pricing);
    /**
     * console.log result:
    {
        "_rev": "6udFvAlfFjsjj7eisrbYXC",
        "introText": "Invest in memories that will last a lifetime. All packages can be customized to meet your specific needs.",
        "title": "Pricing",
        "_updatedAt": "2025-04-20T10:47:46Z",
        "_createdAt": "2025-04-20T10:44:46Z",
        "_type": "pricing",
        "pricingTiers": [
            {
                "sessionDetails": "1 hour • 20 edited digital photos",
                "name": "Basic",
                "_key": "9c98e4375de5",
                "features": [
                    "One location",
                    "Quick turnaround (7 days)",
                    "Personal use license"
                ],
                "price": "$300"
            },
            {
                "_key": "04d3509701db8c3ce7e68ee7c09306ab",
                "features": [
                    "Two locations",
                    "Quick turnaround (7 days)",
                    "Personal use license",
                    "10 professional prints"
                ],
                "price": "$500",
                "sessionDetails": "2 hours • 40 edited digital photos",
                "name": "Standard"
            },
            {
                "_key": "2c17232e3823a2717a206d9830202d06",
                "features": [
                    "Multiple locations",
                    "Rapid turnaround (5 days)",
                    "Commercial use license",
                    "20 professional prints",
                    "Online gallery"
                ],
                "price": "$800",
                "sessionDetails": "3 hours • All edited digital photos",
                "name": "Premium"
            }
        ],
        "customPackagesSection": {
            "sectionTitle": "Custom Packages",
            "description": "Need something different? I offer custom photography packages tailored to your specific needs.",
            "contactButtonText": "Contact me for details",
            "contactButtonUrl": "/contact"
        },
        "_id": "2e8e1037-30a9-440f-ba66-908857ae64a4"
    }
     */

    return {
        pricing
    };
}; 