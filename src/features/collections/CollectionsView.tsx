'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { client as api } from '@/lib/api/client';
import { ChevronRight, Sparkles, Layers, ArrowRight } from 'lucide-react';
import Reveal from '@/components/shared/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { resolveMediaURL } from '@/utils/mediaUtils';

export const CollectionsView = () => {
    const [collections, setCollections] = useState<{ id: string; title: string; items: any[] }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                // We'll use the home API which already groups by badge/section
                const { data } = await api.get('/products/home');
                const sections = data.dynamicSections || [];
                
                // Also add core categories if needed, or just stick to 'Badged' collections
                setCollections(sections);
            } catch (err) {
                console.error("Collections Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCollections();
    }, []);

    return (
        <div className="bg-white min-h-screen pb-32 selection:bg-black selection:text-white">
            {/* HERO */}
            <section className="relative pt-44 pb-20 px-6 bg-zinc-950 text-white overflow-hidden rounded-b-[4rem]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                <div className="container-responsive relative z-10 text-center">
                    <Reveal width="100%">
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-mega mb-6">Discovery Series</p>
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                            Curated <br /> <span className="text-zinc-800">Collections.</span>
                        </h1>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest max-w-xl mx-auto leading-relaxed mb-12">
                            Explore artifacts grouped by studio themes, elite drops, and specialized series.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link 
                                href="/shop"
                                className="px-12 py-5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all flex items-center gap-4 shadow-2xl shadow-white/10"
                            >
                                View Full Archive <ArrowRight size={14} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* COLLECTIONS GRID */}
            <div className="container-responsive mt-20 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-zinc-50 animate-pulse rounded-[3rem]" />
                        ))
                    ) : collections.length > 0 ? (
                        collections.map((col, idx) => (
                            <Reveal key={col.id} delay={idx * 0.1} width="100%">
                                <Link 
                                    href={`/shop?badge=${encodeURIComponent(col.title)}`}
                                    className="group block relative aspect-[4/5] bg-zinc-50 rounded-[3.5rem] overflow-hidden border border-zinc-100 hover:shadow-2xl transition-all duration-700 hover:-translate-y-4"
                                >
                                    <div className="absolute inset-0 p-12 flex flex-col justify-between z-20">
                                        <div>
                                            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                                <Layers size={20} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-zinc-900 group-hover:text-black transition-colors">
                                                {col.title}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-4">
                                                {col.items?.length || 0} Artifacts
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 group-hover:translate-x-4 transition-transform duration-500">
                                            <span className="text-[10px] font-black uppercase tracking-mega text-zinc-900">Explore Drop</span>
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>

                                    {/* PREVIEW IMAGES */}
                                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] flex gap-4 rotate-12 group-hover:rotate-6 transition-all duration-1000">
                                        {col.items?.slice(0, 2).map((item: { image: string }, i: number) => (
                                            <div key={i} className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 p-2">
                                                <img 
                                                    src={resolveMediaURL(item.image)} 
                                                    alt="" 
                                                    className="w-full h-full object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-700" 
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </Link>
                            </Reveal>
                        ))
                    ) : (
                        <div className="col-span-full py-40 text-center bg-zinc-50 rounded-[4rem] border-2 border-dashed border-zinc-100">
                             <Sparkles size={40} className="mx-auto text-zinc-200 mb-6" />
                             <p className="text-[10px] font-black uppercase tracking-mega text-zinc-400">Initializing Collections Archive</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
