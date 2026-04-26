'use client';

import React from 'react';

export const ShippingView = () => {
    return (
        <div className="bg-white min-h-screen pt-24 md:pt-52 pb-20 px-6 selection:bg-black selection:text-white page-top">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Shipping & Delivery</h1>

                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <p className="text-sm font-bold text-zinc-800 leading-relaxed">
                        To ensure every piece meets our strict quality standards and comes directly from our master artisans,
                        please allow <span className="text-black">7-14 days</span> for delivery.
                        This direct-to-consumer model cuts out the middleman, ensuring you get authentic luxury at an honest price.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Order Tracking</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        Once your order is shipped, you will receive a tracking number via email.
                        You can also track your order status in your account dashboard.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Delivery Coverage</h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        We currently deliver across <span className="text-black font-bold">India only</span>.
                        Free shipping is available on all orders above ₹1,999. Orders below this threshold
                        are subject to a flat delivery charge, which will be displayed at checkout.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Delivery Timelines</h2>
                    <div className="space-y-2 text-xs text-zinc-500 leading-relaxed">
                        <p>🏙️ <span className="text-black font-bold">Metro Cities</span> — 3–5 business days</p>
                        <p>🌆 <span className="text-black font-bold">Tier-2 / Tier-3 Cities</span> — 5–7 business days</p>
                        <p>🏘️ <span className="text-black font-bold">Remote Locations</span> — 7–14 business days</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
