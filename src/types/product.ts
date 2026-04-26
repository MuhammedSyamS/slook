export interface IVariant {
    _id?: string;
    size?: string;
    color?: string;
    stock: number;
    price?: number;
    image?: string;
    countInStock?: number; // Some parts of the app use this
    qty?: number; // Some parts use this
}

export interface IReview {
    _id: string;
    name: string;
    rating: number;
    comment: string;
    title?: string;
    user: string | { _id: string; name: string; avatar?: string }; 
    isApproved: boolean;
    createdAt: string;
    images?: string[];
    videos?: string[];
    video?: string;
    reviewImage?: string;
    helpful?: string[];
}

export interface ISpec {
    key: string;
    value: string;
}

export interface IProduct {
    _id: string;
    name: string;
    slug: string;
    price: number;
    costPrice?: number;
    category: string;
    subcategory?: string;
    image: string;
    images?: string[];
    description?: string;
    richDescription?: string;
    story?: string;
    video?: string;
    videos?: string[];
    badge?: string;
    tags?: string[];
    specs?: ISpec[];
    countInStock: number;
    stock?: number;
    qty?: number;
    rating: number;
    numReviews: number;
    viewCount?: number;
    variants?: IVariant[];
    reviews?: IReview[];
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isFlashSale?: boolean;
    discountPrice?: number;
    flashSalePrice?: number;
    flashSaleExpiry?: string | Date;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
}
