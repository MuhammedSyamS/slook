'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/shared/ProductCard';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { Share2, Heart, Lock, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import { motion, AnimatePresence } from 'framer-motion';

export const WishlistView = () => {
    const router = useRouter();
    const { user, setUser, wishlist, setWishlist } = useAuthStore();
    const { success, error } = useToast();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/wishlist');
                setWishlistItems(data);
                setWishlist(data); // Sync store
            } catch (err: any) {
                console.error("Error fetching wishlist:", err);
                error(err.response?.data?.message || "Failed to load wishlist");
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [user, setWishlist]);

    const handleShare = () => {
        if (!user) return;
        const link = `${window.location.origin}/wishlist/shared/${user._id || user.id}`;
        navigator.clipboard.writeText(link);
        success("Link copied to clipboard");
    };

    if (loading && user) {
        return <div className="min-h-screen bg-white pb-20 pt-44 md:pt-52 px-4 md:px-6 font-sans text-[#1a1a1a] text-center uppercase font-black tracking-widest text-[10px] text-zinc-400">Loading Wishlist...</div>;
    }

    return (
        <div className="bg-white min-h-screen pt-44 md:pt-52 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group mx-auto"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12 md:mb-16 text-center">
                    <h1 className="!text-3xl md:!text-5xl font-black uppercase tracking-tighter mb-2 text-black leading-none">
                        My <span className="text-red-600">Wishlist</span>
                    </h1>
                    <div className="h-0.5 w-10 bg-black mx-auto mt-4"></div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 mt-6">
                        {wishlistItems.length} items saved in your collection
                    </p>
                    {wishlistItems.length > 0 && (
                        <button 
                            onClick={handleShare}
                            className="mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-all"
                        >
                            <Share2 size={12} /> Share Collection
                        </button>
                    )}
                </div>

                {!user ? (
                    <div className="text-center py-16 md:py-24 border border-dashed border-zinc-200 rounded-3xl mx-4 md:mx-0">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6 md:mb-8">Please login to view your wishlist</p>
                        <Link 
                            href="/login" 
                            className="inline-block bg-black text-white px-10 py-4 md:px-12 md:py-5 font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200 rounded-full"
                        >
                            Login Now
                        </Link>
                    </div>
                ) : wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-4 md:px-0">
                        {wishlistItems.map((product, idx) => (
                            <ProductCard 
                                key={`${product._id}-${idx}`}
                                product={product} 
                                onAddToCart={async () => {
                                    // Custom behavior
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 md:py-24 bg-zinc-50 rounded-[2rem] md:rounded-[40px] border border-zinc-100 mx-4 md:mx-0">
                        <p className="text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] mb-6 md:mb-8">Your wishlist is empty</p>
                        <Link 
                            href="/shop" 
                            className="inline-block border-b-2 border-black pb-1 font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:text-zinc-500 hover:border-zinc-500 transition-all text-black"
                        >
                            Discover Collections
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
