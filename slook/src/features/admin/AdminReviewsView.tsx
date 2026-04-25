'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { client as api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { 
    MessageSquare, Star, Trash2, Eye, EyeOff, 
    MessageCircle, X, Search, Quote, Shield, Pencil 
} from 'lucide-react';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminReviewsView = () => {
    const { user } = useAuthStore();
    const { addToast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products/admin/reviews');
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch reviews", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const toggleVisibility = async (productId: string, reviewId: string) => {
        try {
            const { data } = await api.put(`/products/${productId}/reviews/${reviewId}/toggle`, {});
            setReviews(prev => prev.map(r => 
                r.review._id === reviewId ? { ...r, review: { ...r.review, isApproved: data.isApproved } } : r
            ));
            addToast(`Review marked as ${data.isApproved ? 'Visible' : 'Hidden'}`, "success");
        } catch (err) {
            addToast("Failed to toggle visibility", "error");
        }
    };

    const handleDelete = async (productId: string, reviewId: string) => {
        if (!window.confirm("Delete this review permanently?")) return;
        try {
            await api.delete(`/products/${productId}/reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r.review._id !== reviewId));
            addToast("Review Deleted", "success");
        } catch (err) {
            addToast("Delete failed", "error");
        }
    };

    const submitReply = async (productId: string, reviewId: string) => {
        if (!replyText.trim()) return;
        try {
            const { data } = await api.put(`/products/${productId}/reviews/${reviewId}/reply`, { response: replyText });
            setReviews(prev => prev.map(r => 
                r.review._id === reviewId ? { ...r, review: { ...r.review, adminResponse: data.adminResponse } } : r
            ));
            setReplyingTo(null);
            setReplyText('');
            addToast("Reply Posted", "success");
        } catch (err) {
            addToast("Reply failed", "error");
        }
    };

    const filteredReviews = reviews.filter(item => {
        if (!item || !item.review) return false;
        const search = searchTerm.toLowerCase();
        return (
            (item.productName || '').toLowerCase().includes(search) ||
            (item.review.comment || '').toLowerCase().includes(search) ||
            (item.review.name || '').toLowerCase().includes(search)
        );
    });

    if (loading && reviews.length === 0) return <div className="p-10 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Loading Reviews...</div>;

    return (
        <div className="font-sans pb-10">
            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] bg-black/90 backdrop-blur flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button className="absolute top-5 right-5 text-white/50 hover:text-white transition p-2 bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={selectedImage}
                            alt="Zoomed Review"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">
                        Review <span className="text-zinc-400">Moderation</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Community Sentiment Analysis (MNC-REVIEWS)</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                    <input
                        type="text"
                        placeholder="Search Reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-full text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black transition w-full md:w-64 shadow-sm"
                    />
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 gap-6">
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
                        <MessageSquare size={48} className="mx-auto text-zinc-200 mb-4" />
                        <h3 className="text-lg font-bold">No Reviews Found</h3>
                    </div>
                ) : (
                    filteredReviews.map((item) => {
                        if (!item || !item.review) return null;
                        return (
                            <div key={item.review._id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition group">

                                {/* Product Info */}
                                <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[200px] border-b md:border-b-0 md:border-r border-zinc-100 pb-4 md:pb-0 md:pr-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0">
                                        <img src={resolveMediaURL(item.productImage)} alt={item.productName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm leading-tight mb-1 truncate">{item.productName}</h4>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={10}
                                                    className={i < item.review.rating ? "fill-black text-black" : "text-zinc-200"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="flex-1 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-black uppercase overflow-hidden border border-zinc-100">
                                                {item.review.user?.avatar ? (
                                                    <img src={resolveMediaURL(item.review.user.avatar)} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <span>{item.review.name?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-tight">{item.review.name}</span>
                                            <span className="text-[10px] text-zinc-400 font-medium ml-2">
                                                {new Date(item.review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleVisibility(item._id, item.review._id)}
                                                className={`p-2 rounded-lg transition-all ${item.review.isApproved ? 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                title={item.review.isApproved ? "Hide Review" : "Show Review"}
                                            >
                                                {item.review.isApproved ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => setReplyingTo(item.review._id)}
                                                className="p-2 bg-zinc-100 text-zinc-400 rounded-lg hover:bg-black hover:text-white transition-all shadow-sm"
                                                title="Reply"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                            {item.review.adminResponse && (
                                                <button
                                                    onClick={() => { setReplyingTo(item.review._id); setReplyText(item.review.adminResponse); }}
                                                    className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    title="Edit Response"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pl-8 relative mb-4">
                                        <Quote size={14} className="absolute left-0 top-0 text-zinc-200" />
                                        <p className="text-sm text-zinc-600 italic leading-relaxed">
                                            {item.review.comment}
                                        </p>

                                        {/* Admin Response Display */}
                                        {item.review.adminResponse && (
                                            <div className="mt-3 bg-zinc-50 p-3 rounded-lg border-l-2 border-black">
                                                <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                                                    <Shield size={10} /> Official Response
                                                </p>
                                                <p className="text-xs text-zinc-600">{item.review.adminResponse}</p>
                                            </div>
                                        )}

                                        {/* Reply Input */}
                                        <AnimatePresence>
                                            {replyingTo === item.review._id && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scaleY: 0 }}
                                                    animate={{ opacity: 1, scaleY: 1 }}
                                                    exit={{ opacity: 0, scaleY: 0 }}
                                                    style={{ originY: 0 }}
                                                    className="mt-3 overflow-hidden"
                                                >
                                                    <textarea
                                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-black transition resize-none"
                                                        placeholder="Write a response..."
                                                        rows={2}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    ></textarea>
                                                    <div className="flex gap-2 mt-2 justify-end">
                                                        <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-zinc-400 hover:text-black px-3 py-1 transition tracking-widest">Cancel</button>
                                                        <button onClick={() => submitReply(item._id, item.review._id)} className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-zinc-800 transition shadow-lg">Post Reply</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Unified Media Render for Admin */}
                                    <div className="flex gap-2 mt-3 pl-8 flex-wrap">
                                        {/* Videos */}
                                        {(item.review.videos || (item.review.video ? [item.review.video] : [])).map((vid: string, i: number) => (
                                            <div key={`v-${i}`} className="w-24 h-16 bg-black rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                                                <video src={resolveMediaURL(vid)} controls className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        {/* Images */}
                                        {item.review.images?.map((img: string, i: number) => (
                                            <img
                                                key={`i-${i}`}
                                                src={resolveMediaURL(img)}
                                                onClick={() => setSelectedImage(resolveMediaURL(img) || null)}
                                                className="w-16 h-16 rounded-lg object-cover border border-zinc-100 cursor-zoom-in hover:scale-110 transition-transform shadow-sm"
                                                alt="review"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Actions (Delete on Hover) */}
                                <div className="flex items-center justify-end md:w-20">
                                    <button
                                        onClick={() => handleDelete(item._id, item.review._id)}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                        title="Delete Review"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
