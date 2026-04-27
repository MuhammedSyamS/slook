'use client';

import React, { useState, useEffect } from 'react';
import { client as api } from '@/lib/api/client';
import { Star, MessageSquare, Filter, ArrowUpRight, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export const ReviewsView = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | number>('all'); // all, 5, 4, 3, 2, 1

    const [selectedReviewIdx, setSelectedReviewIdx] = useState<number | null>(null);
    const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
    const [expandedText, setExpandedText] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await api.get('/products/reviews/all');
                setReviews(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const filteredReviews = reviews.filter(r => {
        if (filter === 'all') return true;
        return Math.floor(r.review.rating) === Number(filter);
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (r.review?.rating || 0), 0) / reviews.length).toFixed(1)
        : "0.0";

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 bg-white">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mb-4"
            >
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full" />
            </motion.div>
            Loading Verified Perspectives...
        </div>
    );

    return (
        <div className="bg-white min-h-screen pt-24 md:pt-40 px-6 pb-20 text-[#1a1a1a] selection:bg-black selection:text-white font-sans">
            
            {/* LIGHTBOX MODAL */}
            <AnimatePresence>
                {selectedReviewIdx !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => { setSelectedReviewIdx(null); setSelectedMediaIdx(0); }}
                    >
                        {/* NAV ARROWS */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReviewIdx((prev) => (prev! - 1 + filteredReviews.length) % filteredReviews.length);
                                setSelectedMediaIdx(0);
                            }}
                            className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 flex-col items-center gap-2"
                        >
                            <ChevronLeft size={48} strokeWidth={1} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReviewIdx((prev) => (prev! + 1) % filteredReviews.length);
                                setSelectedMediaIdx(0);
                            }}
                            className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 flex-col items-center gap-2"
                        >
                            <ChevronRight size={48} strokeWidth={1} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-6xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(() => {
                                const activeReviewItem = filteredReviews[selectedReviewIdx!];
                                const videos = activeReviewItem?.review?.videos || (activeReviewItem?.review?.video ? [activeReviewItem.review.video] : []);
                                const images = activeReviewItem?.review?.images || [];
                                const allMedia = [
                                    ...videos.map((v: string) => ({ type: 'video', url: v })),
                                    ...images.map((i: string) => ({ type: 'image', url: i }))
                                ];
                                const currentMedia = allMedia[selectedMediaIdx] || null;

                                return (
                                    <>
                                        <button 
                                            onClick={() => { setSelectedReviewIdx(null); setSelectedMediaIdx(0); }}
                                            className="absolute top-6 right-6 z-[130] bg-black/5 p-3 rounded-full hover:bg-black/10 transition-all active:scale-90"
                                        >
                                            <X size={20} />
                                        </button>

                                        {/* MEDIA SIDE */}
                                        <div className="w-full md:w-3/5 h-[40vh] md:h-auto bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                                            {currentMedia && (
                                                <>
                                                    {currentMedia.type === 'video' ? (
                                                        <video src={resolveMediaURL(currentMedia.url)} controls autoPlay className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Image src={resolveMediaURL(currentMedia.url)} alt="Review" fill className="object-contain" />
                                                    )}
                                                    
                                                    {allMedia.length > 1 && (
                                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                                                            {allMedia.map((_: any, i: number) => (
                                                                <button 
                                                                    key={i} 
                                                                    onClick={() => setSelectedMediaIdx(i)}
                                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === selectedMediaIdx ? 'bg-black scale-125' : 'bg-black/20'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* INFO SIDE */}
                                        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between overflow-y-auto">
                                            <div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center font-black text-white text-sm">
                                                        {(activeReviewItem.review.name || "A").charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-[0.2em]">{activeReviewItem.review.name || "Verified Buyer"}</p>
                                                        <div className="flex gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={10} fill={i < activeReviewItem.review.rating ? "black" : "none"} className={i < activeReviewItem.review.rating ? "text-black" : "text-zinc-200"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-4 leading-tight">{activeReviewItem.review.title}</h3>
                                                <p className="text-zinc-600 font-medium leading-relaxed text-sm md:text-base mb-8">"{activeReviewItem.review.comment}"</p>
                                            </div>

                                            <div className="pt-8 border-t border-zinc-100 flex items-center justify-between">
                                                <Link 
                                                    href={`/product/${activeReviewItem.productSlug}`} 
                                                    className="flex items-center gap-3 group"
                                                    onClick={() => setSelectedReviewIdx(null)}
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden relative">
                                                        <Image src={resolveMediaURL(activeReviewItem.productImage)} alt="" fill className="object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest mb-1">Reviewed Product</p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest group-hover:underline underline-offset-4">{activeReviewItem.productName}</p>
                                                    </div>
                                                </Link>
                                                <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest">
                                                    {new Date(activeReviewItem.review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto">
                {/* HEADER */}
                <div className="mb-20 text-center">
                    <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                        Verified <span className="text-zinc-300">Perspectives</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-zinc-400 font-medium text-sm md:text-base px-2 uppercase tracking-widest">
                        Real intelligence from our global community about the artifacts they curate.
                    </p>
                </div>

                {/* STATS & FILTERS */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-12 border-b border-zinc-100 pb-12">
                    <div className="flex items-end gap-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Total Intel</p>
                            <p className="text-4xl md:text-6xl font-black tracking-tighter">{reviews.length}</p>
                        </div>
                        <div className="w-px h-16 bg-zinc-100"></div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Rating Index</p>
                            <div className="flex items-center gap-4">
                                <p className="text-4xl md:text-6xl font-black tracking-tighter">{averageRating}</p>
                                <div className="flex text-black pb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < Math.round(Number(averageRating)) ? "black" : "none"} className={i < Math.round(Number(averageRating)) ? "text-black" : "text-zinc-200"} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 bg-zinc-50 p-1.5 rounded-[1.5rem] overflow-x-auto no-scrollbar w-full lg:w-auto border border-zinc-100">
                        {['all', 5, 4, 3, 2, 1].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-black text-white shadow-xl scale-105'
                                    : 'text-zinc-400 hover:bg-zinc-200 hover:text-black'
                                    }`}
                            >
                                {f === 'all' ? 'All Signals' : `${f} Stars`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* REVIEWS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredReviews.map((item, reviewIdx) => (
                        <motion.div 
                            layout
                            key={reviewIdx} 
                            className="bg-zinc-50/50 rounded-[2.5rem] p-8 border border-transparent hover:border-zinc-200 hover:bg-white hover:shadow-2xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center font-black text-xs text-black shadow-sm shrink-0">
                                        {(item.review.name || "A").charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className="text-[11px] font-black uppercase tracking-widest text-black leading-none">{item.review.name || "Verified"}</p>
                                            <CheckCircle2 size={12} className="text-zinc-400" />
                                        </div>
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                            {item.review.date ? new Date(item.review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Verified Perspective'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={11} fill={i < item.review.rating ? "black" : "none"} className={i < item.review.rating ? "text-black" : "text-zinc-100"} />
                                    ))}
                                </div>
                            </div>

                            <div 
                                className="mb-8 cursor-pointer"
                                onClick={() => setExpandedText(prev => ({ ...prev, [reviewIdx]: !prev[reviewIdx] }))}
                            >
                                <h3 className="font-black text-xs uppercase tracking-widest mb-3 text-black leading-tight">{item.review.title}</h3>
                                <p className={`text-zinc-500 font-medium leading-relaxed text-sm ${expandedText[reviewIdx] ? '' : 'line-clamp-4'}`}>
                                    "{item.review.comment}"
                                </p>
                            </div>

                            {/* MEDIA PREVIEW */}
                            {(item.review.images?.length > 0 || item.review.videos?.length > 0) && (
                                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
                                    {(() => {
                                        const videos = item.review.videos || (item.review.video ? [item.review.video] : []);
                                        const images = item.review.images || [];
                                        const allMedia = [
                                            ...videos.map((v: string) => ({ type: 'video', url: v })),
                                            ...images.map((i: string) => ({ type: 'image', url: i }))
                                        ];

                                        return allMedia.slice(0, 3).map((media: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedReviewIdx(reviewIdx);
                                                    setSelectedMediaIdx(idx);
                                                }}
                                                className="relative w-20 h-28 rounded-2xl flex-shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform border border-zinc-100 shadow-sm"
                                            >
                                                {media.type === 'video' ? (
                                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                                        <ArrowUpRight size={20} className="text-white" />
                                                    </div>
                                                ) : (
                                                    <Image src={resolveMediaURL(media.url)} alt="" fill className="object-cover" />
                                                )}
                                            </div>
                                        ));
                                    })()}
                                    { ( (item.review.images?.length || 0) + (item.review.videos?.length || 0) ) > 3 && (
                                        <div 
                                            onClick={() => setSelectedReviewIdx(reviewIdx)}
                                            className="w-20 h-28 rounded-2xl flex-shrink-0 bg-zinc-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer hover:bg-zinc-200 transition-colors"
                                        >
                                            +{((item.review.images?.length || 0) + (item.review.videos?.length || 0)) - 3}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto">
                                <Link 
                                    href={`/product/${item.productSlug}`} 
                                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 hover:border-black transition-all group/link"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-50 overflow-hidden shrink-0 relative">
                                            <Image src={resolveMediaURL(item.productImage)} alt="" fill className="object-cover group-hover/link:scale-110 transition-transform" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-black truncate">{item.productName}</p>
                                    </div>
                                    <ArrowUpRight size={14} className="text-zinc-300 group-hover/link:text-black transition-colors" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
