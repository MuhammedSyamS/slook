'use client';

import React, { useEffect, useState } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { Star, ChevronLeft, ChevronRight, Trash2, Calendar, Quote, X } from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const MyReviewsView = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReviewIdx, setSelectedReviewIdx] = useState<number | null>(null);
    const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await api.get('/products/reviews/my-reviews');
                setReviews(data);
            } catch (err) {
                console.error("Failed to fetch user reviews", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchReviews();
    }, [user]);

    const handleDelete = async (productId: string, reviewId: string) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            await api.delete(`/products/${productId}/reviews/${reviewId}`);
            setReviews(reviews.filter(r => r.review._id !== reviewId));
            success("Review purged successfully.");
        } catch (err) {
            toastError("Failed to delete review.");
        }
    };

    if (loading) return <div className="text-center pt-52 font-black uppercase tracking-widest text-zinc-300 animate-pulse">Syncing Contributions...</div>;

    return (
        <div className="min-h-screen bg-white pt-40 md:pt-48 pb-20 px-4 md:px-6 selection:bg-black selection:text-white page-top">
            {/* LIGHTBOX MODAL */}
            <AnimatePresence>
                {selectedReviewIdx !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                        onClick={() => { setSelectedReviewIdx(null); setSelectedMediaIdx(0); }}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all bg-white/5 p-3 rounded-full hover:rotate-90">
                            <X size={32} />
                        </button>

                        <div
                            className="relative w-full max-w-6xl bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(() => {
                                const activeReviewItem = reviews[selectedReviewIdx];
                                const allImages = activeReviewItem?.review?.images || (activeReviewItem?.review?.reviewImage ? [activeReviewItem.review.reviewImage] : []);
                                const currentImage = allImages[selectedMediaIdx];

                                return (
                                    <>
                                        <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                                            {currentImage ? (
                                                <>
                                                    <img src={resolveMediaURL(currentImage)} alt="Review Media" className="w-full h-full object-cover" />
                                                    {allImages.length > 1 && (
                                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                                                            {allImages.map((_: any, i: number) => (
                                                                <button 
                                                                    key={i} 
                                                                    onClick={() => setSelectedMediaIdx(i)}
                                                                    className={`h-1 rounded-full transition-all ${i === selectedMediaIdx ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-200 italic">No Artifact Attached</div>
                                            )}
                                        </div>

                                        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                                            <div className="flex gap-1.5 mb-8">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} fill={i < (activeReviewItem.review.rating || 0) ? "black" : "none"} className={i < (activeReviewItem.review.rating || 0) ? "text-black" : "text-zinc-100"} />
                                                ))}
                                            </div>

                                            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                                {activeReviewItem.productName}
                                            </h3>
                                            
                                            <p className="text-sm md:text-lg font-medium text-zinc-500 leading-relaxed italic mb-12">
                                                "{activeReviewItem.review.comment}"
                                            </p>

                                            <div className="mt-auto pt-8 border-t border-zinc-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest">{user?.firstName} {user?.lastName}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1"> Verified Acquisition </p>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-200 italic">
                                                    {new Date(activeReviewItem.review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto space-y-16">
                <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black transition-all mb-8 bg-zinc-50 px-4 py-2 rounded-full w-fit group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Account</span>
                </button>

                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="!text-xl md:!text-5xl font-black uppercase tracking-tighter leading-none">
                            My <span className="text-red-600">Reviews</span>
                        </h1>
                        <div className="h-0.5 w-10 bg-black mt-2 md:mt-4"></div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg md:text-3xl font-black uppercase tracking-tighter leading-none">{reviews.length}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Total Contributions</p>
                    </div>
                </div>

                {reviews.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 rounded-[3rem] p-20 text-center space-y-8">
                        <Star size={64} className="mx-auto text-zinc-200" strokeWidth={1} />
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Zero Submissions</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">The feedback ledger awaits your first entry</p>
                        </div>
                        <button onClick={() => router.push('/shop')} className="bg-black text-white px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">
                            Initialize Shopping
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid gap-10">
                        {reviews.map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-zinc-100 hover:border-black transition-all hover:shadow-2xl"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={10} fill={i < item.review.rating ? "black" : "none"} className={i < item.review.rating ? "text-black" : "text-zinc-100"} />
                                                ))}
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                                {new Date(item.review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">{item.productName}</h2>
                                            <p className="text-xs md:text-sm font-medium text-zinc-500 leading-relaxed uppercase tracking-wide max-w-xl">
                                                "{item.review.comment}"
                                            </p>
                                        </div>

                                        {/* Review Media Previews */}
                                        <div className="flex gap-3 pt-2">
                                            {(item.review.images || (item.review.reviewImage ? [item.review.reviewImage] : [])).map((img: string, mIdx: number) => (
                                                <div 
                                                    key={mIdx}
                                                    onClick={() => { setSelectedReviewIdx(idx); setSelectedMediaIdx(mIdx); }}
                                                    className="w-16 h-20 rounded-2xl overflow-hidden border border-zinc-50 cursor-zoom-in hover:scale-105 transition-all shadow-sm"
                                                >
                                                    <img src={resolveMediaURL(img)} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-6 shrink-0">
                                        <div 
                                            onClick={() => router.push(`/product/${item.productSlug}`)}
                                            className="w-16 h-20 md:w-24 md:h-32 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-zinc-100 cursor-pointer hover:border-black transition-all shadow-sm group-hover:shadow-xl"
                                        >
                                            <img src={resolveMediaURL(item.productImage)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(item._id, item.review._id)}
                                            className="p-4 bg-zinc-50 text-zinc-300 hover:bg-black hover:text-white rounded-full transition-all group/del"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
