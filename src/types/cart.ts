import { IProduct, IVariant } from './product';

export interface ICartItem {
    product: string;
    _id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    category?: string;
    slug?: string;
    selectedVariant?: IVariant;
}

export interface ICoupon {
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    minAmount?: number;
}
