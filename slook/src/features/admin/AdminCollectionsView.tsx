'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { 
    Tag, Package, ArrowRight, ExternalLink, 
    Search, Filter, RotateCcw, Plus 
} from 'lucide-react';
import Link from 'next/link';

export const AdminCollectionsView = () => {
    const [collections, setCollections] = useState<{ id: string; title: string; items: any[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products/home');
            setCollections(data.dynamicSections || []);
        } catch (err) {
            console.error("Failed to fetch admin collections", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const filtered = collections.filter(c => 
        c.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Collection <span className="text-zinc-400">Management</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
                        Active Studio Badges & Curated Groups
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchCollections}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition"
                    >
                        <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link 
                        href="/admin/products"
                        className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition"
                    >
                        <Plus size={14} /> Assign Badges
                    </Link>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="bg-white p-4 border border-zinc-200 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                        type="text"
                        placeholder="Search collections..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border-none rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg flex items-center gap-2 border border-transparent">
                        <Filter size={14} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase text-zinc-600">{filtered.length} Active Series</span>
                    </div>
                </div>
            </div>

            {/* COLLECTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-2xl" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((col) => (
                        <div 
                            key={col.id}
                            className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-xl hover:border-black/5 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center">
                                    <Tag size={18} strokeWidth={1.5} />
                                </div>
                                <Link 
                                    href={`/shop?badge=${encodeURIComponent(col.title)}`}
                                    target="_blank"
                                    className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-black transition"
                                >
                                    <ExternalLink size={14} />
                                </Link>
                            </div>

                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{col.title}</h3>
                            <div className="flex items-center gap-2 text-zinc-500 mb-6">
                                <Package size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{col.items?.length || 0} Products Linked</span>
                            </div>

                            <Link 
                                href={`/admin/products?badge=${encodeURIComponent(col.title)}`}
                                className="w-full py-3 bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-900 flex items-center justify-center gap-2 group-hover:bg-black group-hover:text-white transition-all"
                            >
                                Manage Products <ArrowRight size={14} />
                            </Link>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
                        <Tag size={40} className="mx-auto text-zinc-200 mb-4" />
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No matching collections found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
