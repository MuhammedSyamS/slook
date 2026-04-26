import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { client as api } from '@/lib/api/client';

interface AuthState {
  user: any;
  wishlist: any[]; // Guest wishlist
  lastRefresh: number;
  setUser: (userData: any) => void;
  login: (userData: any) => void;
  logout: () => void;
  setWishlist: (wishlist: any[]) => void;
  toggleWishlist: (product: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  syncGuestWishlist: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      wishlist: [],
      lastRefresh: 0,

      setUser: (userData) => set({ user: userData }),
      
      login: (userData) => {
        if (userData?.token) {
          document.cookie = `token=${userData.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
        set({ user: userData });
      },

      logout: () => {
        // Clear cookie for middleware
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        set({ user: null });
      },

      setWishlist: (data) => {
        const state = get();
        if (state.user) {
          set({ user: { ...state.user, wishlist: data } });
        } else {
          set({ wishlist: data });
        }
      },

      toggleWishlist: async (product) => {
        const state = get();
        const productId = (product._id || product).toString();

        if (state.user) {
          const originalUser = state.user;
          const currentWishlist = state.user.wishlist || [];
          const exists = currentWishlist.some((item: any) => (item._id || item).toString() === productId);

          let newWishlist;
          if (exists) {
            newWishlist = currentWishlist.filter((item: any) => (item._id || item).toString() !== productId);
          } else {
            newWishlist = [...currentWishlist, product];
          }

          set({ user: { ...state.user, wishlist: newWishlist } });

          try {
            const { data } = await api.post('/wishlist', { productId });
            set({ user: { ...get().user, wishlist: data } });
          } catch (error) {
            console.error("Wishlist sync failed:", error);
            set({ user: originalUser });
          }
        } else {
          const currentWishlist = state.wishlist || [];
          const exists = currentWishlist.some((item: any) => (item._id || item).toString() === productId);

          let newWishlist;
          if (exists) {
            newWishlist = currentWishlist.filter((item: any) => (item._id || item).toString() !== productId);
          } else {
            newWishlist = [...currentWishlist, product];
          }

          set({ wishlist: newWishlist });
        }
      },

      refreshUser: async () => {
        const state = get();
        if (!state.user?.token) return;
        
        const now = Date.now();
        if (now - state.lastRefresh < 60000) return; // Throttle: once per 60s max

        try {
          const { data } = await api.get('/users/profile');
          set({ 
            user: { ...data, token: state.user.token },
            lastRefresh: now
          });
        } catch (err) {
          console.error('refreshUser failed:', err);
        }
      },

      syncGuestWishlist: async () => {
        const state = get();
        if (!state.user?.token || !state.wishlist?.length) return;

        try {
          const productIds = state.wishlist.map(item => (item._id || item).toString());
          const { data } = await api.post('/users/wishlist/bulk', { productIds });
          set({
            user: { ...get().user, wishlist: data },
            wishlist: []
          });
        } catch (err) {
          console.error("Failed to sync guest wishlist:", err);
        }
      }
    }),
    {
      name: 'slook-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        wishlist: state.wishlist
      })
    }
  )
);
