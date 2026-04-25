import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { client as api } from '@/lib/api/client';
import { isSameVariant, getItemId } from '@/utils/cartUtils';
import { ICartItem, ICoupon } from '@/types/cart';
import { IVariant } from '@/types/product';

interface CartState {
  items: ICartItem[];
  coupon: ICoupon | null;
  addItem: (product: ICartItem) => Promise<void>;
  updateQuantity: (productId: string, variant: IVariant | undefined, change: number) => Promise<void>;
  removeItem: (productId: string, variant: IVariant | undefined, itemId?: string) => Promise<void>;
  clearCart: () => void;
  setCart: (items: ICartItem[]) => void;
  applyCoupon: (data: ICoupon) => void;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: async (product) => {
        const state = get();
        const productId = product._id;
        
        const existingItem = state.items.find((item) => {
          return getItemId(item) === (productId || '').toString() && 
                 isSameVariant(item.selectedVariant, product.selectedVariant);
        });

        let updatedItems;
        if (existingItem) {
          updatedItems = state.items.map((item) => {
            if (getItemId(item) === productId && isSameVariant(item.selectedVariant, product.selectedVariant)) {
              return { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) };
            }
            return item;
          });
        } else {
          updatedItems = [...state.items, { ...product, product: productId, quantity: product.quantity || 1 }];
        }

        set({ items: updatedItems });

        // Only sync with server if user is authenticated
        const isAuthenticated = (() => {
          try {
            const authStorage = typeof window !== 'undefined' ? localStorage.getItem('slook-auth-storage') : null;
            if (!authStorage) return false;
            const { state } = JSON.parse(authStorage);
            return !!state?.user?.token;
          } catch { return false; }
        })();

        if (!isAuthenticated) return;

        try {
          const { data } = await api.post('/cart/add', {
            productId,
            quantity: product.quantity || 1,
            selectedVariant: product.selectedVariant,
            name: product.name,
            price: product.price,
            image: product.image
          });
          if (data && Array.isArray(data)) set({ items: data });
        } catch (err) {
          console.error("Cart sync failed:", err);
        }
      },

      updateQuantity: async (productId, variant, change) => {
        const state = get();
        const updatedItems = state.items.map(item => {
          if (getItemId(item) === productId.toString() && isSameVariant(item.selectedVariant, variant)) {
            const newQty = (item.quantity || 1) + change;
            return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
        });

        set({ items: updatedItems });

        const isAuthenticated = (() => {
          try {
            const authStorage = typeof window !== 'undefined' ? localStorage.getItem('slook-auth-storage') : null;
            if (!authStorage) return false;
            const { state } = JSON.parse(authStorage);
            return !!state?.user?.token;
          } catch { return false; }
        })();

        if (!isAuthenticated) return;

        try {
          let response;
          if (change > 0) {
            response = await api.post('/cart/add', { productId, quantity: 1, selectedVariant: variant });
          } else {
            response = await api.post('/cart/decrease', { productId, selectedVariant: variant });
          }
          if (response?.data && Array.isArray(response.data)) set({ items: response.data });
        } catch (err) { console.error("Cart update failed:", err); }
      },

      removeItem: async (productId, variant, itemId) => {
        const state = get();
        const updatedItems = state.items.filter(item => {
          if (itemId && item._id === itemId) return false;
          return !(getItemId(item) === productId.toString() && isSameVariant(item.selectedVariant, variant));
        });

        set({ items: updatedItems });

        const isAuthenticated = (() => {
          try {
            const authStorage = typeof window !== 'undefined' ? localStorage.getItem('slook-auth-storage') : null;
            if (!authStorage) return false;
            const { state } = JSON.parse(authStorage);
            return !!state?.user?.token;
          } catch { return false; }
        })();

        if (!isAuthenticated) return;

        try {
          const { data } = await api.post('/cart/remove', { productId, selectedVariant: variant, _id: itemId });
          if (data && Array.isArray(data)) set({ items: data });
        } catch (err) { console.error("Remove failed:", err); }
      },

      clearCart: () => set({ items: [] }),

      setCart: (items) => set({ items }),

      applyCoupon: (data) => set({ coupon: data }),
      
      removeCoupon: () => set({ coupon: null }),
    }),
    {
      name: 'slook-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
