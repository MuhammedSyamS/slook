'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, 
    Ticket, Flame, Clock, Gift, ShieldCheck, 
    ChevronLeft, ChevronRight, CheckCircle2, Heart,
    Zap, ShoppingCart, Lock
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import Price from '@/components/shared/Price';
import { client as api } from '@/lib/api/client';
import Reveal from '@/components/shared/Reveal';
import Link from 'next/link';

export const CartView = () => {
    const router = useRouter();
    const { items, updateQuantity, removeItem, coupon, applyCoupon, removeCoupon } = useCartStore();
    const { user } = useAuthStore();
    const { toggleCart } = useUIStore();
    const { settings, fetchSettings } = useSettingsStore();

    const [couponCode, setCouponCode] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = (coupon && typeof coupon.discount === 'number') ? coupon.discount : 0;
    const total = subtotal - discount;

    useEffect(() => {
        if (!settings) fetchSettings();
    }, [settings, fetchSettings]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get('/products/random?limit=4');
                setSuggestions(data);
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        };
        fetchSuggestions();
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            setLoading(true);
            const { data } = await api.post('/marketing/verify-coupon', {
                code: couponCode,
                cartTotal: subtotal,
                userId: user?._id
            });
            applyCoupon({ 
                code: data.code, 
                discount: data.discount,
                discountType: data.discountType || 'fixed'
            });
            setCouponCode('');
        } catch (err: any) {
            alert(err.response?.data?.message || "Invalid Coupon");
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
                <Reveal width="100%">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center">
                            <ShoppingBag size={40} className="text-zinc-200" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Your Bag is Empty</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Discover artifacts to fill your studio collection</p>
                        </div>
                        <button 
                            onClick={() => router.push('/shop')}
                            className="px-12 py-5 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all"
                        >
                            Start Curating
                        </button>
                    </div>
                </Reveal>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-40 selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row gap-16 relative">
                    {/* Left Column: Cart Items */}
                    <div className="flex-1 space-y-12">
                        <header className="space-y-2">
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Studio <span className="text-zinc-200">Bag</span></h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Items: {items.length} Artifacts</p>
                        </header>

                        <div className="space-y-6">
                            {items.map((item, idx) => (
                                <Reveal key={`${item._id}-${item.selectedVariant?.size}-${item.selectedVariant?.color}`} width="100%" delay={idx * 0.1}>
                                    <div className="group flex flex-col sm:flex-row gap-8 pb-8 border-b border-zinc-50 hover:border-black transition-colors duration-500">
                                        <div className="w-full sm:w-48 aspect-[3/4] bg-zinc-50 rounded-[2.5rem] overflow-hidden border border-zinc-100 group-hover:scale-[0.98] transition-all duration-700">
                                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between py-2">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 group-hover:text-black transition-colors">{item.name}</h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{item.category}</p>
                                                    </div>
                                                    <Price amount={item.price} className="text-xl font-black" />
                                                </div>

                                                {item.selectedVariant && (
                                                    <div className="flex gap-6">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase text-zinc-300">Dimension</p>
                                                            <p className="text-[11px] font-black uppercase">{item.selectedVariant.size}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase text-zinc-300">Signature</p>
                                                            <p className="text-[11px] font-black uppercase">{item.selectedVariant.color}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-8">
                                                <div className="flex items-center gap-6 bg-zinc-50 px-6 py-3 rounded-2xl border border-zinc-100">
                                                    <button onClick={() => updateQuantity(item.product, item.selectedVariant, -1)} className="text-zinc-400 hover:text-black transition-colors"><Minus size={14} /></button>
                                                    <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product, item.selectedVariant, 1)} className="text-zinc-400 hover:text-black transition-colors"><Plus size={14} /></button>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <button className="text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-amber-500 transition-colors">Move to Saved</button>
                                                    <div className="w-1 h-1 bg-zinc-100 rounded-full" />
                                                    <button 
                                                        onClick={() => removeItem(item.product, item.selectedVariant, item._id)}
                                                        className="text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-red-500 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary */}
                    <div className="w-full md:w-[420px] shrink-0">
                        <div className="sticky top-40 space-y-8">
                            <div className="bg-zinc-50 rounded-[3rem] p-10 space-y-10 border border-zinc-100 shadow-2xl shadow-black/[0.02]">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        <span>Subtotal</span>
                                        <Price amount={subtotal} className="text-zinc-900" />
                                    </div>
                                    
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-600">
                                            <span>Studio Credits</span>
                                            <Price amount={-discount} />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        <span>Shipping</span>
                                        <span className="text-zinc-900">
                                            {settings?.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold ? 'FREE' : 'Calculated at checkout'}
                                        </span>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-200/50 flex justify-between items-end">
                                        <span className="text-xl font-black uppercase tracking-tight">Total</span>
                                        <div className="text-right">
                                            <Price amount={total} className="text-3xl font-black block leading-none" />
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Inclusive of taxes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Promo Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Ticket size={12} className="text-zinc-300" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Have a code?</p>
                                    </div>
                                    
                                    {coupon ? (
                                        <div className="flex items-center justify-between p-4 bg-black text-white rounded-2xl">
                                            <span className="text-[10px] font-black uppercase">{coupon.code}</span>
                                            <button onClick={removeCoupon} className="p-1 hover:bg-white/20 rounded-full"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="ENTER HERE"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="flex-1 bg-white border border-zinc-100 rounded-2xl px-5 py-4 text-[10px] font-black uppercase placeholder:text-zinc-200 outline-none focus:border-black transition-colors"
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={loading}
                                                className="bg-zinc-900 text-white px-6 rounded-2xl text-[9px] font-black uppercase hover:bg-black active:scale-95 transition-all"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => router.push('/checkout')}
                                    className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-zinc-900 shadow-2xl shadow-black/20 active:scale-[0.98] transition-all group"
                                >
                                    <span>Secure <span className="text-amber-400 group-hover:text-white transition-colors">Checkout</span></span>
                                    <Lock size={14} />
                                </button>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <CheckCircle2 size={12} />
                                        <p className="text-[8px] font-bold uppercase tracking-widest">Complimentary returns on all artifacts</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <ShieldCheck size={12} />
                                        <p className="text-[8px] font-bold uppercase tracking-widest">End-to-end studio encryption</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations Mini Strip */}
                            {suggestions.length > 0 && (
                                <div className="space-y-6 pt-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Complete the Look</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {suggestions.slice(0, 2).map(sug => (
                                            <Link href={`/product/${sug.slug}`} key={sug._id} className="group">
                                                <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 mb-3 group-hover:scale-[0.98] transition-all duration-700">
                                                    <img src={sug.image} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase truncate italic">{sug.name}</p>
                                                <Price amount={sug.price} className="text-[10px] font-bold text-zinc-400" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
