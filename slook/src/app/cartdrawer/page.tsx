'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';

export default function CartDrawerPage() {
  const router = useRouter();
  const toggleCart = useUIStore((state) => state.toggleCart);

  useEffect(() => {
    // Open the cart and redirect home
    toggleCart(true);
    router.replace('/');
  }, [toggleCart, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
}
