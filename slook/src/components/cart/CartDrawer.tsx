'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Heart, Flame, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { client as api } from '@/lib/api/client';
import Price from '@/components/shared/Price';
import { useRouter } from 'next/navigation';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { useToast } from '@/context/ToastContext';

const CartDrawer = () => {
    const { items: cartItems, updateQuantity, removeItem, addItem, setCart, coupon: appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
    const { isCartOpen, toggleCart } = useUIStore();
    const { user, setUser } = useAuthStore();
    const { settings, fetchSettings } = useSettingsStore();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [couponCode, setCouponCode] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasFetchedSuggestions = useRef(false);
    const router = useRouter();
    const { addToast, success, error: toastError } = useToast();

    const handleSaveForLater = async (itemId: string, productId?: string, variant?: any) => {
        if (!user) return addToast("Login to save for later", "info");
        try {
            // BACKEND SYNCHRONIZATION: Normalize variant for exact backend match
            const normalizedVariant = variant ? { 
                size: variant.size, 
                color: variant.color 
            } : {};

            const { data } = await api.post('/cart/save', { 
                _id: itemId,
                productId: (productId || itemId || '').toString(),
                selectedVariant: normalizedVariant
            });

            // CRITICAL: Synchronize both stores to prevent "ghost items"
            setUser({ ...user, cart: data.cart, savedForLater: data.savedForLater });
            setCart(data.cart); // Update UI CartStore with the actual server state
            
            addToast("Saved for later", "success");
        } catch (err: any) { 
            console.error("SAVE FOR LATER ERROR:", err.response?.data || err.message);
            addToast(err.response?.data?.message || "Failed to save item", "error"); 
        }
    };

    const handleMoveToCart = async (itemId: string) => {
        if (!user) return;
        try {
            const { data } = await api.post('/cart/move-to-cart', { _id: itemId });
            
            // CRITICAL: Synchronize both stores
            setUser({ ...user, cart: data.cart, savedForLater: data.savedForLater });
            setCart(data.cart); // Update UI CartStore

            addToast("Moved to cart", "success");
        } catch (err) { addToast("Failed to move item", "error"); }
    };

    useEffect(() => {
        if (!settings) fetchSettings();
    }, [settings, fetchSettings]);

    useEffect(() => {
        if (isCartOpen) {
            // Update URL to /cartdrawer when open
            window.history.pushState({ cartOpen: true }, '', '/cartdrawer');
        } else if (window.location.pathname === '/cartdrawer') {
            // Go back when closed if we are on /cartdrawer
            router.back();
        }
    }, [isCartOpen, router]);

    useEffect(() => {
        if (isCartOpen) {
            const fetchSuggestions = async () => {
                try {
                    // Optimization: Fetch only 5 random products instead of the entire catalog
                    const { data } = await api.get('/products/random?limit=5');
                    setSuggestions(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error("Failed to fetch suggestions", err);
                }
            };
            fetchSuggestions();
        }
    }, [isCartOpen]);

    const subtotal = cartItems.reduce((acc, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        return acc + (price * qty);
    }, 0);

    const discount = (appliedCoupon && typeof appliedCoupon.discount === 'number') ? appliedCoupon.discount : 0;
    const total = Math.max(0, (subtotal || 0) - (discount || 0));

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const { data } = await api.post('/marketing/verify-coupon', {
                code: couponCode,
                cartTotal: subtotal,
                userId: user?._id || user?.id
            });
            applyCoupon({ 
                code: data.code, 
                discount: data.discount,
                discountType: data.discountType 
            });
            addToast(data.message || "Coupon Applied", "success");
            setCouponCode('');
        } catch (err: any) {
            addToast(err.response?.data?.message || "Invalid Coupon", "error");
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -200 : 200;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isCartOpen && (
                <div className="fixed inset-0 z-[300] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => toggleCart(false)}
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full sm:max-w-[420px] bg-[#f8f8f8] h-full shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="py-2.5 px-4 md:py-2 md:px-5 flex items-center justify-between bg-black text-white border-b border-white/10 shadow-lg shrink-0">
                            <h2 className="font-black uppercase tracking-[0.2em] text-[12px] md:text-[14px]">Your <span className="text-red-600">Selection</span></h2>
                            <button onClick={() => toggleCart(false)} className="p-1.5 hover:bg-white/10 rounded-full transition">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
                            {cartItems.length > 0 ? (
                                <>
                                    {/* Scarcity Alert */}
                                    <div className="bg-red-50 border border-red-100 p-2 md:p-1.5 rounded-xl md:rounded-lg mb-4 md:mb-3 flex items-center gap-2 animate-pulse">
                                        <div className="bg-red-500 text-white p-1 rounded-full"><Flame size={10} fill="currentColor" /></div>
                                        <div>
                                            <p className="text-[9px] md:text-[8px] font-black uppercase tracking-tight text-red-900 leading-none mb-0.5">High Demand Artifacts</p>
                                            <p className="text-[8px] md:text-[7px] font-bold text-red-600 uppercase tracking-widest leading-none">Items in bag are reserved for 10:00</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 md:space-y-2">
                                        {cartItems.map((item, idx) => (
                                            <div key={`${item._id}-${idx}`} className="bg-white p-3 md:p-2.5 rounded-2xl md:rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100/80 flex gap-3 md:gap-2.5 group hover:border-black transition-all duration-300">
                                                <div className="w-20 h-24 md:w-16 md:h-20 rounded-xl md:rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 group-hover:scale-95 transition-transform duration-500">
                                                    <img src={resolveMediaURL(item.image) || "/placeholder.jpg"} className="w-full h-full object-cover" alt={item.name} />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-1">
                                                            <p className="font-black text-[11px] md:text-[9px] uppercase tracking-normal md:tracking-wider text-black leading-tight flex-1 line-clamp-2">{item.name}</p>
                                                            <Price amount={item.price} className="font-black text-[10px] md:text-[9px] text-black bg-zinc-100 px-1.5 py-0.5 rounded shrink-0" />
                                                        </div>
                                                        {item.selectedVariant && (
                                                            <p className="text-[10px] md:text-[8px] text-zinc-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                                                {item.selectedVariant.size && `Size ${item.selectedVariant.size} `}
                                                                {item.selectedVariant.size && item.selectedVariant.color && ` / `}
                                                                {item.selectedVariant.color}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <div className="flex items-center gap-2 md:gap-1.5 bg-zinc-100 rounded-xl md:rounded-lg px-2 py-1.5 md:px-2.5 md:py-1 border border-zinc-200/50">
                                                                <button onClick={() => updateQuantity(item._id, item.selectedVariant, -1)} className="text-zinc-400 hover:text-black transition-colors p-0.5"><Minus className="w-2.5 h-2.5 md:w-2.5 md:h-2.5" /></button>
                                                                <span className="font-black text-[10px] md:text-[9px] w-3 text-center text-black">{item.quantity}</span>
                                                                <button onClick={() => updateQuantity(item._id, item.selectedVariant, 1)} className="text-zinc-400 hover:text-black transition-colors p-0.5"><Plus className="w-2.5 h-2.5 md:w-2.5 md:h-2.5" /></button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            <button 
                                                                onClick={() => {
                                                                    const productId = (item.product?._id || item.product || item._id || '').toString();
                                                                    handleSaveForLater(item._id, productId, item.selectedVariant);
                                                                }} 
                                                                className="p-1 text-zinc-300 hover:text-amber-500 transition-colors" 
                                                                title="Save for Later"
                                                            >
                                                                <Heart size={11} />
                                                            </button>
                                                            <button 
                                                                onClick={() => { 
                                                                    const productId = (item.product?._id || item.product || item._id || '').toString();
                                                                    removeItem(productId, item.selectedVariant, item._id); 
                                                                    addToast("Item removed", "info"); 
                                                                }} 
                                                                className="p-1 text-zinc-300 hover:text-red-500 transition-colors" 
                                                                title="Remove Item"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="bg-white p-4 md:p-3 rounded-2xl md:rounded-xl border border-zinc-100 shadow-sm space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={12} className="text-zinc-400" />
                                                <p className="text-[9px] md:text-[8px] font-black uppercase tracking-normal md:tracking-widest text-zinc-400">Promotional Code</p>
                                            </div>
                                            {appliedCoupon && (
                                                <button onClick={() => { removeCoupon(); addToast("Coupon Removed", "info"); }} className="text-[9px] md:text-[8px] text-red-500 font-bold uppercase tracking-wider hover:underline">Remove</button>
                                            )}
                                        </div>
                                        {appliedCoupon ? (
                                            <div className="p-3 md:p-2 bg-green-50 border border-green-100 rounded-xl md:rounded-lg flex justify-between items-center">
                                                <span className="text-[11px] md:text-[9px] font-black uppercase text-green-700">{appliedCoupon.code} Applied</span>
                                                <Price amount={appliedCoupon.discount} className="text-[11px] md:text-[9px] font-bold text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="ENTER CODE"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    className="flex-1 bg-[#f8f8f8] border border-transparent rounded-xl md:rounded-lg px-3 py-3 md:px-3 md:py-2 text-[10px] md:text-[8px] font-black uppercase tracking-normal md:tracking-widest outline-none focus:border-zinc-200 transition-all font-mono"
                                                />
                                                <button onClick={handleApplyCoupon} className="bg-black text-white px-4 md:px-4 rounded-xl md:rounded-lg text-[9px] md:text-[8px] font-black uppercase tracking-normal md:tracking-widest active:scale-95 transition-transform">
                                                    Apply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
                                    <div className="opacity-50 flex flex-col items-center">
                                        <div className="bg-zinc-50 p-4 rounded-full mb-2">
                                            <ShoppingBag size={32} strokeWidth={1.5} className="text-zinc-300" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Your Cart is Empty</p>
                                        <button onClick={() => { toggleCart(false); router.push('/shop'); }} className="text-xs font-bold underline underline-offset-4 decoration-zinc-300 hover:decoration-black hover:text-black transition-all mt-2">
                                            Start Curating
                                        </button>
                                    </div>

                                    {/* QUICK ADD TRENDING STRIP */}
                                    <div className="w-full pt-10 border-t border-zinc-50">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-6">Trending Now</p>
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
                                            {suggestions.slice(0, 3).map((sug, idx) => (
                                                <div key={`trending-${idx}`} onClick={() => { router.push(`/product/${sug.slug || sug._id}`); toggleCart(false); }} className="min-w-[140px] bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm cursor-pointer group">
                                                        <div className="aspect-[3/4] bg-zinc-50 rounded-xl overflow-hidden mb-3 relative group">
                                                            <img src={resolveMediaURL(sug.image) || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                            <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        addItem({ ...sug, quantity: 1, selectedVariant: sug.variants?.[0] || {} }); 
                                                                        addToast(`Added ${sug.name} to selection`, "success");
                                                                    }}
                                                                    className="bg-black text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    <p className="text-[9px] font-black uppercase truncate text-zinc-600 group-hover:text-black transition-colors mb-1">{sug.name}</p>
                                                    <Price amount={sug.price} className="text-[10px] font-bold text-zinc-900" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Variations: Suggestions / Saved for Later */}
                            {suggestions.length > 0 && cartItems.length > 0 && (
                                <div className="pt-4 border-t border-zinc-100 space-y-3 relative">
                                    <div className="flex items-center justify-between ml-1 pr-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">You Might Also Like</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => scroll('left')} className="p-1.5 bg-white border border-zinc-200 rounded-full hover:bg-black hover:text-white transition shadow-sm">
                                                <ChevronLeft size={10} />
                                            </button>
                                            <button onClick={() => scroll('right')} className="p-1.5 bg-white border border-zinc-200 rounded-full hover:bg-black hover:text-white transition shadow-sm">
                                                <ChevronRight size={10} />
                                            </button>
                                        </div>
                                    </div>
                                    <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
                                        {suggestions
                                            .filter(s => !cartItems.some(c => (c.product?._id || c.product || c._id) === s._id))
                                            .map((sug, idx) => (
                                                <div key={`rec-${idx}`} onClick={() => { router.push(`/product/${sug.slug || sug._id}`); toggleCart(false); }} className="min-w-[130px] snap-center bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm cursor-pointer hover:border-black transition-all group relative">
                                                    <div className="aspect-[3/4] bg-zinc-50 rounded-xl overflow-hidden mb-3 relative">
                                                        <img src={resolveMediaURL(sug.image) || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={sug.name} />
                                                        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    addItem({ ...sug, quantity: 1, selectedVariant: sug.variants?.[0] || {} }); 
                                                                    addToast(`Added ${sug.name} to cart`, "success");
                                                                }}
                                                                className="bg-black text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase truncate text-zinc-600 group-hover:text-black transition-colors">{sug.name}</p>
                                                    <Price amount={sug.price} className="text-[10px] font-bold text-zinc-900 mt-0.5" />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* SAVED FOR LATER SECTION */}
                            {user?.savedForLater?.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-zinc-100">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Saved for Later</h3>
                                    {user.savedForLater.map((item: any) => (
                                        <div key={item._id} className="bg-zinc-50 p-3 rounded-xl flex gap-3 opacity-75 hover:opacity-100 transition group">
                                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-zinc-200">
                                                <img src={resolveMediaURL(item.image) || "/placeholder.jpg"} className="w-full h-full object-cover" alt={item.name} />
                                            </div>
                                            <div className="flex-1 flex justify-between items-center">
                                                <div>
                                                    <p className="font-black text-[10px] uppercase text-zinc-600 line-clamp-1">{item.name}</p>
                                                    <Price amount={item.price} className="text-[10px] font-bold text-zinc-400" />
                                                </div>
                                                <button onClick={() => handleMoveToCart(item._id)} className="text-[9px] font-black uppercase bg-white px-3 py-2 rounded-lg border border-zinc-200 hover:border-black shadow-sm active:scale-95 transition-all">
                                                    Move to Cart
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="p-3 md:p-3 bg-white border-t border-zinc-200 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] space-y-3 shrink-0">
                                
                                {/* Free Shipping Bar */}
                                {subtotal > 0 && settings?.freeShippingThreshold > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] md:text-[8px] font-black uppercase tracking-widest">
                                            {subtotal >= (settings?.freeShippingThreshold || 5000) ? (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={10} /> You've unlocked FREE Shipping!</span>
                                            ) : (
                                                <span className="text-zinc-500">₹{(Math.max(0, (settings?.freeShippingThreshold || 5000) - subtotal)).toLocaleString()} away from <span className="text-black">FREE Shipping</span></span>
                                            )}
                                            <span className="text-zinc-400">{Math.min(100, Math.round((subtotal / (settings?.freeShippingThreshold || 5000)) * 100))}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (subtotal / settings.freeShippingThreshold) * 100)}%` }}
                                                className={`h-full transition-all duration-1000 ease-out ${subtotal >= settings.freeShippingThreshold ? 'bg-green-500' : 'bg-black'}`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* LOYALTY EARNINGS */}
                                {user && (
                                    <div className="bg-amber-50 border border-amber-100 p-1.5 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="bg-amber-400 text-white p-0.5 rounded-full"><Ticket size={8} fill="currentColor" /></div>
                                            <span className="text-[8px] font-bold uppercase text-amber-900 tracking-wide">
                                                Earn {Math.floor((total || 0) / 100)} Coins
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-bold text-amber-900">
                                            Balance: {user.loyaltyPoints || 0}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        <span>Subtotal</span>
                                        <Price amount={subtotal} />
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-[11px] md:text-[9px] font-black uppercase tracking-widest text-green-600">
                                            <span>Studio Discount</span>
                                            <Price amount={discount} />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-1">
                                        <span className="text-xs font-black uppercase text-black">Total</span>
                                        <div className="text-right">
                                            <Price amount={total} className="text-xl font-black uppercase block leading-none text-black" />
                                            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Incl. all taxes</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        window.scrollTo(0, 0);
                                        toggleCart(false);
                                        router.push('/checkout');
                                    }}
                                    className="group w-full bg-black text-white py-2.5 md:py-2.5 rounded-xl md:rounded-lg font-black uppercase tracking-[0.2em] text-[10px] md:text-[8px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-zinc-900 transition-all shadow-xl shadow-black/10 px-4"
                                >
                                    <span>Secure <span className="text-amber-400 group-hover:text-white transition-colors">Checkout</span></span> <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
