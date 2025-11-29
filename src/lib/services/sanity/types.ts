// Shared TypeScript interfaces and types for Sanity services

export interface SanityClientConfig {
    projectId: string;
    dataset: string;
    apiVersion: string;
    token: string;
    useCdn: boolean;
    useProjectHostname?: boolean;
    perspective?: 'published' | 'raw' | 'previewDrafts';
    ignoreBrowserTokenWarning?: boolean;
}

export interface SanityImage {
    _type: string;
    asset: {
        _ref: string;
        _type: string;
        _id?: string;
        url?: string;
        metadata?: {
            dimensions?: {
                width: number;
                height: number;
            };
        };
    };
}

export interface SanityCategory {
    _id: string;
    _type: string;
    name: string;
    order?: number;
    thumbnail?: SanityImage;
    password?: string;
}

export interface SanityGalleryImage {
    _id: string;
    _type: string;
    order?: number;
    image: SanityImage;
    category: {
        _type: string;
        _ref: string;
    };
    spanTwoColumns?: boolean;
}

export interface FormattedCategory {
    id: string;
    documentId: string;
    attributes: {
        name: string;
        order: number;
        passwordProtected?: boolean;
        thumbnail: {
            data: {
                attributes: {
                    url: string;
                    thumbnailUrl?: string;
                    placeholderUrl?: string;
                    fullSizeUrl?: string;
                    width?: number;
                    height?: number;
                };
            };
        } | null;
        images?: {
            data: FormattedImage[];
        };
    };
}

export interface FormattedImage {
    id: string;
    documentId?: string;
    attributes: {
        order: number;
        spanTwoColumns?: boolean;
        image: {
            data: {
                attributes: {
                    url: string;
                    thumbnailUrl?: string;
                    placeholderUrl?: string;
                    fullSizeUrl?: string;
                };
            };
        };
    };
}

export interface CategoryData {
    name: string;
    order?: number;
    password?: string;
    thumbnail?: File;
    data?: {
        name: string;
        order?: number;
        password?: string;
        thumbnail?: File;
    };
}

export interface ImageData {
    order?: number;
    image: File;
    category: string;
}

// Add support for TypeScript types in browser
declare global {
    interface Window {
        process: any;
    }
}
