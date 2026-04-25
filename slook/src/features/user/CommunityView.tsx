'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, Heart, ShoppingBag, Plus, Sparkles, ChevronRight, Share2, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from '@/components/shared/Price';
import { useToast } from '@/context/ToastContext';

const LookModal = ({ look, onClose, user, handleToggleLike, handleAddFullLook }: any) => {
    if (!look) return null;
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-10 bg-black/95 backdrop-blur-xl"
        >
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:rotate-90 transition-transform duration-300 z-[120] p-2 md:p-4 hover:opacity-70">
                <X size={24} className="md:w-8 md:h-8" />
            </button>

            <div className="bg-white w-full max-w-6xl max-h-[95vh] md:max-h-[85vh] md:h-full rounded-t-[2.5rem] md:rounded-[3rem] overflow-y-auto no-scrollbar md:overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
                {/* IMAGE SIDE */}
                <div className="relative w-full aspect-[4/5] md:aspect-auto md:flex-1 bg-zinc-950 overflow-hidden group flex-shrink-0 flex items-center justify-center max-h-[60vh] md:max-h-none">
                    <img src={resolveMediaURL(look.image)} className="w-full h-full object-contain md:object-cover" alt="" />
                    <div className="absolute inset-0 pointer-events-none md:pointer-events-auto">
                        {look.products?.map((prod: any) => (
                            <div
                                key={prod._id}
                                className="absolute w-8 h-8 bg-zinc-900 shadow-xl rounded-full flex items-center justify-center cursor-pointer hover:scale-125 transition-transform group/tag pointer-events-auto"
                                style={{ left: `${prod.x}%`, top: `${prod.y}%` }}
                            >
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white text-black p-3 rounded-2xl shadow-2xl opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none min-w-[150px] md:min-w-[180px]">
                                    <div className="flex gap-3 items-center">
                                        <img src={resolveMediaURL(prod.image)} className="w-8 h-10 md:w-10 md:h-12 object-cover rounded-lg" alt="" />
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter truncate">{prod.name}</p>
                                            <Price amount={prod.price} className="text-[10px] md:text-[11px] font-bold text-zinc-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="w-2 h-2 bg-white rounded-full animate-ping absolute" />
                                <ShoppingBag size={14} className="text-white relative z-10" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* DETAILS SIDE */}
                <div className="w-full md:w-[400px] flex flex-col p-6 md:p-8 bg-white flex-shrink-0 min-h-[400px] md:min-h-0">
                    <div className="flex items-center gap-3 mb-8 pb-8 border-b border-zinc-50 uppercase">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-100 flex items-center justify-center overflow-hidden">
                            {look.user?.avatar ? (
                                <img src={resolveMediaURL(look.user.avatar)} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-white font-black">{(look.displayHandle?.[0] || "S").toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight">@{look.formattedHandle}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SLOOK ELITE MEMBER</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                        <p className="text-lg font-medium text-zinc-800 leading-relaxed italic">
                            "{look.caption}"
                        </p>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Shop this Look</p>
                            {look.products?.map((prod: any) => (
                                <div
                                    key={prod._id}
                                    onClick={() => { router.push(`/product/${prod.slug || prod._id}`); onClose(); }}
                                    className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:border-black hover:bg-white transition-all group/item"
                                >
                                    <img src={resolveMediaURL(prod.image)} className="w-16 h-20 object-cover rounded-2xl" alt="" />
                                    <div className="flex-1">
                                        <p className="text-xs font-black uppercase tracking-tight mb-1">{prod.name}</p>
                                        <Price amount={prod.price} className="text-sm font-bold text-zinc-500" />
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 mt-auto border-t border-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleToggleLike(look._id)}
                                className="flex items-center gap-2 hover:scale-110 transition-transform"
                            >
                                <Heart
                                    size={20}
                                    className={look.likes?.some((id: any) => id.toString() === user?._id?.toString()) ? "fill-red-500 text-red-500" : "text-zinc-400"}
                                />
                                <span className="text-[10px] font-black">{look.likes?.length || 0}</span>
                            </button>
                            <button className="hover:scale-110 transition-transform">
                                <Share2 size={20} className="text-zinc-400" />
                            </button>
                        </div>
                        <button
                            onClick={() => { handleAddFullLook(look); onClose(); }}
                            className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 shadow-xl transition-all"
                        >
                            Add Full Look
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const CommunityView = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { addItem: addToCart } = useCartStore();
    const { success, error: toastError } = useToast();

    // Agency Mouse State
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

    const [looks, setLooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLook, setActiveLook] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const handleAddFullLook = (look: any) => {
        if (!look.products?.length) return;

        look.products.forEach((prod: any) => {
            addToCart({
                ...prod,
                quantity: 1,
                selectedVariant: null
            });
        });
        success("Full Look Added to Bag! ✨");
    };

    const handleToggleLike = async (lookId: string) => {
        if (!user) {
            toastError("Please login to like styles! 💖");
            return;
        }
        try {
            const { data } = await api.post(`/looks/${lookId}/like`);
            setLooks(prev => prev.map(l =>
                l._id === lookId ? { ...l, likes: data.likes } : l
            ));
            if (activeLook && activeLook._id === lookId) {
                setActiveLook((prev: any) => ({ ...prev, likes: data.likes }));
            }
        } catch (err) {
            console.error('Like toggle failed:', err);
        }
    };

    const fetchLooks = async (pageNum = 1, append = false) => {
        if (pageNum > 1) setLoadingMore(true);
        else setLoading(true);

        try {
            const { data } = await api.get(`/looks?page=${pageNum}&limit=9`);
            const looksData = data.looks || [];
            
            const mappedData = looksData.map((l: any) => {
                const u = l.user;
                const displayHandle = (u ? `${u.firstName} ${u.lastName}`.trim() : l.userName) || "House Stylist";
                return {
                    ...l,
                    displayHandle,
                    formattedHandle: displayHandle.toLowerCase().replace(/\s+/g, '')
                };
            });

            if (append) {
                setLooks(prev => [...prev, ...mappedData]);
            } else {
                setLooks(mappedData);
            }
            
            setTotalPages(data.pages || 1);
            setPage(pageNum);
        } catch (err) {
            console.error('Error fetching looks:', err);
            if (!append) setLooks([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchLooks(1, false);
    }, []);

    return (
        <div className="min-h-screen bg-white pt-44 md:pt-52 pb-32 md:pb-20">
            <div className="max-w-7xl mx-auto px-6">

                {/* HEADER - PRODUCTION STYLE */}
                <div className="text-center mb-24 space-y-8">
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                        STYLED BY <span className="text-zinc-300">YOU</span>
                    </h1>
                    <div className="flex flex-col items-center gap-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">COMMUNITY CURATION #STYLEDBYSLOOK</p>
                        <Link
                            href="/account?action=upload"
                            className="bg-black text-white px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3 group"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            Share Your House Style
                        </Link>
                    </div>
                </div>

                {/* FEED GRID - MASONRY STYLE */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-20">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[3/5] bg-zinc-50 rounded-[2.5rem] animate-pulse border border-zinc-100" />
                        ))}
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
                        {looks.map((look) => (
                            <motion.div
                                key={look._id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                onClick={() => setActiveLook(look)}
                                className="break-inside-avoid group cursor-pointer relative"
                            >
                                <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl transition-all duration-700 hover:-translate-y-2">
                                    
                                    {/* Main Image */}
                                    <div className="w-full overflow-hidden bg-zinc-100">
                                        <img 
                                            src={resolveMediaURL(look.image)} 
                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" 
                                            alt="" 
                                            loading="lazy" 
                                        />
                                    </div>

                                    {/* Card Footer (User Info & Caption) */}
                                    <div className="p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-100 flex items-center justify-center overflow-hidden">
                                                    {look.user?.avatar ? (
                                                        <img src={resolveMediaURL(look.user.avatar)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[12px] text-white font-black">{(look.displayHandle?.[0] || "S").toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black uppercase tracking-tight text-zinc-900 leading-none">@{look.formattedHandle}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Sparkles size={10} className="text-amber-500 fill-amber-500" />
                                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Elite Stylist</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleToggleLike(look._id); }}
                                                    className="flex items-center gap-1.5 hover:scale-110 transition-transform"
                                                >
                                                    <Heart 
                                                        size={14} 
                                                        className={look.likes?.some((id: any) => id.toString() === user?._id?.toString()) ? "fill-red-500 text-red-500" : "text-zinc-300"} 
                                                    />
                                                    <span className="text-[11px] font-black text-zinc-900">{look.likes?.length || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[12px] font-black text-zinc-900 uppercase tracking-tight leading-relaxed">
                                            "{look.caption}"
                                        </p>
                                    </div>

                                    {/* Hover Action Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500 pointer-events-none" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* LOAD MORE BUTTON */}
                {page < totalPages && (
                    <div className="flex justify-center py-24">
                        <button
                            onClick={() => fetchLooks(page + 1, true)}
                            disabled={loadingMore}
                            className="bg-black text-white px-16 py-6 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl disabled:opacity-50 flex items-center gap-4 group"
                        >
                            {loadingMore ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Load More Stories
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>

            {/* LOOK MODAL */}
            <AnimatePresence>
                {activeLook && (
                    <LookModal 
                        look={activeLook} 
                        onClose={() => setActiveLook(null)} 
                        user={user}
                        handleToggleLike={handleToggleLike}
                        handleAddFullLook={handleAddFullLook}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
