'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const CookieSync = () => {
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get current token cookie
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (user?.token) {
      if (tokenCookie !== user.token) {
        // Sync cookie with store
        document.cookie = `token=${user.token}; path=/; max-age=31104000; SameSite=Lax`;
        console.log('CookieSync: Token cookie synchronized');
      }
    } else if (tokenCookie) {
      // Clear cookie if no user but cookie exists
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      console.log('CookieSync: Token cookie cleared');
    }
  }, [user?.token]);

  return null;
};
