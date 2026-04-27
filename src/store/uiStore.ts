import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { client as api } from '@/lib/api/client';

interface IFlashSale {
  _id: string;
  name: string;
  discountPercentage: number;
  endTime: string;
  startTime: string;
  isActive: boolean;
  products: any[];
}

interface UIState {
  isSearchOpen: boolean;
  isCartOpen: boolean;
  isDesktopSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  isMenuOpen: boolean;
  currency: string;
  currencyRates: Record<string, number>;
  flashSale: IFlashSale | null;
  toggleSearch: () => void;
  toggleCart: (open?: boolean) => void;
  toggleDesktopSidebar: () => void;
  toggleMobileSidebar: () => void;
  toggleAdminSidebar: () => void;
  closeMobileSidebar: () => void;
  setIsMenuOpen: (open: boolean) => void;
  setCurrency: (currency: string) => void;
  setCurrencyRates: (rates: Record<string, number>) => void;
  fetchFlashSale: () => Promise<void>;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isSearchOpen: false,
      isCartOpen: false,
      isDesktopSidebarOpen: true,
      isMobileSidebarOpen: false,
      isMenuOpen: false,
      currency: 'INR',
      currencyRates: { 'INR': 1, 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0093 },
      flashSale: null,

      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      toggleCart: (open?: boolean) => set((state) => ({ 
        isCartOpen: typeof open === 'boolean' ? open : !state.isCartOpen 
      })),
      toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      toggleAdminSidebar: () => set((state) => ({
        isDesktopSidebarOpen: !state.isDesktopSidebarOpen,
        isMobileSidebarOpen: !state.isMobileSidebarOpen
      })),
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
      setIsMenuOpen: (open: boolean) => set({ isMenuOpen: open }),
      setCurrency: (currency) => set({ currency }),
      setCurrencyRates: (rates) => set({ currencyRates: rates }),
      fetchFlashSale: async () => {
        try {
          // Use a signal or timeout override if needed, but 20s is standard
          const { data } = await api.get('/marketing/flash-sale', {
            // Signal to allow aborting if needed, or just standard timeout
          });
          set({ flashSale: data });
        } catch (err: any) {
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            console.warn("Flash sale fetch timed out, using fallback (null)");
          } else {
            console.error("Failed to fetch flash sale", err);
          }
          // Don't crash the UI, just set to null if it fails
          set({ flashSale: null });
        }
      },
    }),
    {
      name: 'slook-ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
