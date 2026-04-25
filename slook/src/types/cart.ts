import { IProduct, IVariant } from './product';

export interface ICartItem extends Partial<IProduct> {
    product: string | IProduct;
    quantity: number;
    selectedVariant?: IVariant;
    _id?: string;
}

export interface ICoupon {
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    minAmount?: number;
}
