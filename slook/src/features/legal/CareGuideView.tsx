'use client';

import React from 'react';

export const CareGuideView = () => {
    return (
        <div className="bg-white min-h-screen pt-44 md:pt-52 pb-20 px-6 selection:bg-black selection:text-white page-top">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Product Care</h1>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest max-w-lg mx-auto">
                        Longevity through intention.
                    </p>
                </div>

                <div className="grid gap-12">
                    <section className="space-y-4 border-b border-zinc-100 pb-12">
                        <h2 className="text-xl font-black uppercase flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">01</span>
                            Jewelry & Accessories
                        </h2>
                        <div className="pl-11 space-y-4 text-sm text-zinc-600 leading-relaxed">
                            <p>
                                <strong>The Eagle Ring & Silver Goods:</strong> Avoid direct contact with harsh chemicals, perfumes, or chlorine. These elements can tarnish the finish.
                            </p>
                            <p>
                                <strong>Cleaning:</strong> Use a soft polishing cloth to maintain the shine. For deeper cleaning, mild soap and warm water are sufficient—ensure the item is completely dry before storing.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4 border-b border-zinc-100 pb-12">
                        <h2 className="text-xl font-black uppercase flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">02</span>
                            Apparel
                        </h2>
                        <div className="pl-11 space-y-4 text-sm text-zinc-600 leading-relaxed">
                            <p>
                                <strong>Premium Cotton & Denim:</strong> Wash cold to preserve the fiber integrity and color. Tumble dry low or, preferably, hang dry to prevent shrinkage and maintain shape.
                            </p>
                            <p>
                                <strong>Structure:</strong> Store coats and structured jackets on wide hangers to support the shoulder construction.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">03</span>
                            Tech & Daily Carry
                        </h2>
                        <div className="pl-11 space-y-4 text-sm text-zinc-600 leading-relaxed">
                            <p>
                                <strong>Headphones & Electronics:</strong> Keep dry and avoid extreme temperatures. Clean contacts/ports gently with compressed air to ensure optimal performance.
                            </p>
                            <p>
                                <strong>Leather Goods:</strong> Condition leather once a season to prevent cracking. Wipe away spills immediately with a dry cloth.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
