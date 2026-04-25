'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, ArrowRight, Sparkles, Share2, Twitter, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { client as api } from '@/lib/api/client';
import Price from '@/components/shared/Price';
import Reveal from '@/components/shared/Reveal';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const UserOrderSuccessView = () => {
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const orderId = searchParams.get('orderId') || "PENDING";
    const [upsellProduct, setUpsellProduct] = useState<any>(null);

    useEffect(() => {
        const fetchUpsell = async () => {
            try {
                const { data } = await api.get('/products');
                const products = Array.isArray(data) ? data : (data?.products || []);
                if (products.length > 0) {
                    const shuffled = [...products].sort(() => 0.5 - Math.random());
                    setUpsellProduct(shuffled[0]);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUpsell();
        window.scrollTo(0, 0);
    }, []);

    const orderRef = orderId.slice(-8).toUpperCase();
    const shareText = `Just secured my latest look from SLOOK! 💎 Order #${orderRef}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const handleShare = (platform: string) => {
        let url = '';
        if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        if (platform === 'whatsapp') url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

        if (url) window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 font-sans text-[#1a1a1a] pb-20 page-top px-4 md:px-6 pt-24 md:pt-52">
            <div className="container-responsive flex items-center justify-center">
                <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 max-w-2xl w-full text-center border border-zinc-100 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500">
                        <CheckCircle size={48} strokeWidth={2.5} />
                    </div>

                    <h1 className="!text-3xl md:!text-5xl font-black uppercase tracking-tighter mb-4">
                        Order Confirmed
                    </h1>

                    <p className="text-zinc-500 font-medium !text-sm md:!text-lg mb-10 leading-relaxed">
                        Thank you for your purchase. We have received your order and will begin processing it shortly.
                    </p>

                    <div className="bg-zinc-50 p-6 rounded-2xl mb-6 border border-zinc-200 inline-block w-full">
                        <p className="!text-[10px] md:!text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Order Reference</p>
                        <p className="!text-lg md:!text-2xl font-black font-mono tracking-widest select-all text-zinc-800">
                            #{orderRef}
                        </p>
                        <p className="!text-[10px] md:!text-xs text-zinc-400 mt-1 font-mono">{orderId}</p>
                    </div>

                    {/* STYLISH TIMELINE */}
                    <div className="max-w-md mx-auto mb-12 overflow-x-auto no-scrollbar py-4 px-2">
                        <div className="flex justify-between relative min-w-[320px]">
                            {/* Background Line */}
                            <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100 z-0"></div>
                            {/* Progress Line */}
                            <div className="absolute top-5 left-0 w-1/4 h-0.5 bg-green-500 z-10 transition-all duration-1000"></div>

                            {[
                                { label: 'Confirmed', sub: 'Today', active: true },
                                { label: 'Processing', sub: 'Tomorrow', active: false },
                                { label: 'Studio Check', sub: '2 Days', active: false },
                                { label: 'Shipped', sub: '3-4 Days', active: false },
                            ].map((s, i) => (
                                <div key={i} className="relative z-20 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${s.active ? 'bg-green-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                        {s.active ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                                    </div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mt-3 ${s.active ? 'text-black' : 'text-zinc-400'}`}>{s.label}</p>
                                    <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IMPORTANT UNBOXING NOTICE */}
                    <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 mb-10 text-left flex gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 text-orange-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="!text-[10px] md:!text-xs font-black uppercase tracking-widest text-orange-700 mb-1">Important: Return Policy</h4>
                            <p className="!text-[11px] md:!text-sm font-medium text-orange-800 leading-relaxed uppercase tracking-tight">
                                Please record an <strong>Unboxing Video</strong> and take pictures when your package arrives.
                                Returns and exchanges will <strong>ONLY</strong> be accepted with valid video proof.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/orders"
                            className="flex items-center justify-center px-8 py-5 border-2 border-zinc-100 rounded-full font-black uppercase tracking-widest text-[10px] hover:border-black hover:bg-white transition-all"
                        >
                            View Order
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center px-8 py-5 bg-black text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
