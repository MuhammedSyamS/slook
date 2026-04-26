import { create } from 'zustand';
import { client as api } from '@/lib/api/client';

interface ISettings {
  freeShippingThreshold: number;
  shippingCharge: number;
  taxRate: number;
  heroSlides?: any[];
  featuredCategories?: any[];
  topBanner?: { show: boolean; text: string; link?: string };
  [key: string]: any;
}

interface SettingsState {
  settings: ISettings;
  loading: boolean;
  hasFetched: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    freeShippingThreshold: 5000,
    shippingCharge: 150,
    taxRate: 18,
  },
  loading: false,
  hasFetched: false,
  fetchSettings: async () => {
    const { hasFetched, loading } = get();
    // Only fetch once per session — prevents a new API call on every navigation
    if (hasFetched || loading) return;

    set({ loading: true });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data, loading: false, hasFetched: true });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      set({ loading: false, hasFetched: true }); // Mark fetched even on error to prevent retries
    }
  },
}));
