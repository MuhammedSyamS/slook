import { IVariant, IProduct } from '@/types/product';

/**
 * Robustly compares two variant objects (size, color, etc.)
 */
export const isSameVariant = (v1: IVariant | null | undefined, v2: IVariant | null | undefined) => {
  if (!v1 && !v2) return true;
  if (!v1 || !v2) return false;
  
  const normalize = (val: string | undefined) => String(val || '').trim().toLowerCase();
  
  return normalize(v1.size) === normalize(v2.size) && 
         normalize(v1.color) === normalize(v2.color);
};

/**
 * Extracts a stable ID from a cart item, handling various nesting patterns
 */
export const getItemId = (item: { product?: IProduct | string, _id?: string } | null) => {
  if (!item) return '';
  const product = item.product;
  const rawId = (typeof product === 'object' ? product?._id : product) || item._id || '';
  return rawId.toString();
};
