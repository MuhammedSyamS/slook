'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { client as api } from '@/lib/api/client';
import { Star, CheckCircle2, ChevronLeft, ChevronRight, Play, Maximize2, MoreHorizontal, ArrowUpRight, X, ArrowRight, Zap, MessageCircle } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveMediaURL } from '@/utils/mediaUtils';
import MarqueeRibbon from '../shared/MarqueeRibbon';

const FeaturedReviews = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [commentExpanded, setCommentExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const displayReviews = useMemo(() => {
        if (reviews.length === 0) return [];
        return [...reviews, ...reviews, ...reviews];
    }, [reviews]);
    
    useEffect(() => {
        const el = scrollRef.current;
        if (el && reviews.length > 0) {
            const singleSetWidth = el.scrollWidth / 3;
            el.scrollLeft = singleSetWidth;
        }
    }, [reviews.length]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || reviews.length === 0) return;

        const handleInfiniteScroll = () => {
            const singleSetWidth = el.scrollWidth / 3;
            if (el.scrollLeft >= singleSetWidth * 2) {
                el.scrollLeft -= singleSetWidth;
            } else if (el.scrollLeft <= 0) {
                el.scrollLeft += singleSetWidth;
            }
        };

        el.addEventListener('scroll', handleInfiniteScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleInfiniteScroll);
    }, [reviews.length]);

    useEffect(() => {
        if (reviews.length <= 1) return;
        const timer = setInterval(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth * 0.8, behavior: 'smooth' });
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [reviews.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            const width = el.clientWidth;
            const scrollAmount = direction === 'left' ? -width * 0.8 : width * 0.8;
            el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        setCommentExpanded(false);
    }, [selectedReview?._id]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await api.get('/products/reviews/featured');
                setReviews(Array.isArray(data) ? data : []);
            } catch (err) {
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const getMediaFromReview = (item: any) => {
        const r = item.review || item;
        const images = Array.isArray(r.images) ? r.images : (r.reviewImage ? [r.reviewImage] : []);
        const videos = Array.isArray(r.videos) ? r.videos : (r.video ? [r.video] : []);

        return [
            ...videos.map((url: string) => ({ type: 'video', url })),
            ...images.map((url: string) => ({ type: 'image', url }))
        ];
    };

    const openModal = (item: any, index: number) => {
        const r = item.review || item;
        const media = getMediaFromReview(item);

        if (window.innerWidth < 768) {
            router.push(`/review/${r._id}`);
            return;
        }

        setSelectedReview({
            ...r,
             media,
             currentMedia: media[0] || null,
             mediaIndex: 0,
             reviewIndex: index,
             user: r.user,
             productName: item.productName || null,
             productSlug: item.productSlug || null,
             productImage: item.productImage || null,
             name: r.name,
             rating: r.rating,
             comment: r.comment,
             isVerified: r.isVerified || r.isVerifiedPurchase
         });
     };

    const nextReview = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedReview) return;
        const nextIdx = (selectedReview.reviewIndex + 1) % reviews.length;
        openModal(reviews[nextIdx], nextIdx);
    };

    const prevReview = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedReview) return;
        const prevIdx = (selectedReview.reviewIndex - 1 + reviews.length) % reviews.length;
        openModal(reviews[prevIdx], prevIdx);
    };

    const nextMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedReview || !selectedReview.media || selectedReview.media.length <= 1) return;
        const nextMediaIdx = (selectedReview.mediaIndex + 1) % selectedReview.media.length;
        setSelectedReview({
            ...selectedReview,
            mediaIndex: nextMediaIdx,
            currentMedia: selectedReview.media[nextMediaIdx]
        });
    };

    const prevMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedReview || !selectedReview.media || selectedReview.media.length <= 1) return;
        const prevMediaIdx = (selectedReview.mediaIndex - 1 + selectedReview.media.length) % selectedReview.media.length;
        setSelectedReview({
            ...selectedReview,
            mediaIndex: prevMediaIdx,
            currentMedia: selectedReview.media[prevMediaIdx]
        });
    };

    return (
        <section className="bg-white py-8 md:py-16 border-t border-zinc-200">
            {selectedReview && (
                <div
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in zoom-in-95 duration-300"
                    onClick={() => setSelectedReview(null)}
                >
                    <button
                        onClick={prevReview}
                        className="hidden md:flex fixed left-12 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 group flex-col items-center gap-2"
                    >
                        <ChevronLeft className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">PREV</span>
                    </button>
                    <button
                        onClick={nextReview}
                        className="hidden md:flex fixed right-12 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 group flex-col items-center gap-2"
                    >
                        <ChevronRight className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">NEXT</span>
                    </button>

                    <div 
                        className="bg-zinc-950 md:bg-white w-full h-full md:w-auto md:max-w-7xl md:h-auto md:max-h-[85vh] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative mx-auto" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950 z-[140]">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-white shadow-xl overflow-hidden uppercase">
                                    {(selectedReview.review?.user || selectedReview.user)?.avatar ? (
                                        <img src={resolveMediaURL((selectedReview.review?.user || selectedReview.user).avatar) || "/placeholder.jpg"} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{((selectedReview.review?.name || selectedReview.name) || "U").charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">{selectedReview.review?.name || selectedReview.name}</p>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={8} fill="currentColor" className="text-white" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedReview(null)}
                                className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setSelectedReview(null)}
                            className="hidden md:block absolute top-6 right-6 z-[130] bg-black text-white p-2.5 rounded-full shadow-2xl border border-white/20 hover:scale-110 active:scale-95 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-full md:w-1/2 h-[50vh] md:h-auto bg-black relative flex items-center justify-center group select-none shrink-0 overflow-hidden">
                            {selectedReview.currentMedia ? (
                                selectedReview.currentMedia.type === 'video' ? (
                                    <video
                                        controls
                                        autoPlay
                                        src={resolveMediaURL(selectedReview.currentMedia.url)}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <img
                                        src={resolveMediaURL(selectedReview.currentMedia.url)}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                )
                            ) : (
                                <div className="text-zinc-500 font-medium italic uppercase tracking-widest text-[10px]">No Media Experience</div>
                            )}

                            <div className="absolute inset-y-0 left-0 w-1/4 z-30 flex items-center justify-start pl-4 md:hidden" onClick={prevMedia}>
                                <div className="text-white/50">
                                    <ChevronLeft size={24} />
                                </div>
                            </div>
                            <div className="absolute inset-y-0 right-0 w-1/4 z-30 flex items-center justify-end pr-4 md:hidden" onClick={nextMedia}>
                                <div className="text-white/50">
                                    <ChevronRight size={24} />
                                </div>
                            </div>

                            <div className="hidden md:block absolute top-8 left-8 z-30 pointer-events-none">
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                                    <div className="w-7 h-7 rounded-lg bg-white overflow-hidden border border-white/5 shrink-0">
                                        <img src={resolveMediaURL(selectedReview.productImage) || "/placeholder.jpg"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[6px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-0.5">Reviewing</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white truncate max-w-[100px]">{selectedReview.productName}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedReview.media?.length > 1 && (
                                <>
                                    <button
                                        onClick={prevMedia}
                                        className="hidden md:flex absolute left-6 bottom-10 text-white/60 hover:text-white p-2 transition-all z-30"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={nextMedia}
                                        className="hidden md:flex absolute right-6 bottom-10 text-white/60 hover:text-white p-2 transition-all z-30"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}

                            {selectedReview.media?.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                    {selectedReview.media.map((_: any, mIdx: number) => (
                                        <div
                                            key={`modal-media-${mIdx}`}
                                            className={`w-1 h-1 rounded-full transition-all duration-300 ${mIdx === selectedReview.mediaIndex ? 'bg-white scale-125' : 'bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-1/2 p-6 md:p-14 flex flex-col bg-zinc-950 md:bg-white overflow-y-auto no-scrollbar relative flex-1">
                            <div className="hidden md:flex items-center gap-4 mb-6 pb-6 border-b border-zinc-50 pt-2">
                                <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-white shadow-xl overflow-hidden uppercase">
                                    {selectedReview.user?.avatar ? (
                                        <img src={resolveMediaURL(selectedReview.user.avatar) || "/placeholder.jpg"} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(selectedReview.name || "U").charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-black text-zinc-900 leading-none uppercase tracking-widest truncate">{selectedReview.name}</h4>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill="currentColor" className="text-black" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-[8px] uppercase tracking-[0.2em] font-black">{selectedReview.role || "Verified Studio Member"}</p>
                                </div>
                            </div>

                            <div className="md:hidden flex items-center gap-3 p-3 mb-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-white/5 shrink-0">
                                    <img src={resolveMediaURL(selectedReview.productImage) || "/placeholder.jpg"} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">Product Reference</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{selectedReview.productName}</p>
                                </div>
                            </div>

                            <div className="flex-1 md:overflow-y-auto no-scrollbar mb-8">
                                <div className="space-y-4">
                                    <p className="text-white md:text-zinc-950 leading-[1.8] text-[13px] md:text-base font-medium whitespace-pre-line">
                                        &quot;{selectedReview.comment}&quot;
                                    </p>
                                    
                                    {selectedReview.comment?.length > 300 && (
                                        <button 
                                            onClick={() => setCommentExpanded(!commentExpanded)}
                                            className="text-[9px] font-black uppercase tracking-widest text-white md:text-zinc-900 border-b border-white md:border-zinc-900 pb-0.5 hover:opacity-70 transition-all flex items-center gap-1"
                                        >
                                            {commentExpanded ? 'Show Less' : 'View Full Experience'}
                                            <ChevronRight size={12} className={`transition-transform duration-300 ${commentExpanded ? '-rotate-90' : 'rotate-90'}`} />
                                        </button>
                                    )}
                                </div>

                                {selectedReview.adminResponse && (
                                    <div className="bg-white/5 md:bg-zinc-50 p-6 rounded-[2rem] border border-white/10 md:border-zinc-100 mt-8 relative overflow-hidden group/response">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white md:text-zinc-900 mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-white md:bg-black rounded-full animate-pulse" /> Official Response
                                        </p>
                                        <p className="text-[11px] md:text-sm text-zinc-400 md:text-zinc-500 leading-relaxed italic font-medium">{selectedReview.adminResponse}</p>
                                    </div>
                                )}
                            </div>

                            <div className="md:hidden grid grid-cols-2 gap-3 mt-auto">
                                <button 
                                    onClick={prevReview}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all"
                                >
                                    <ChevronLeft size={20} className="mb-1 opacity-50" />
                                    <span className="text-[8px] font-black tracking-widest uppercase">Previous Review</span>
                                </button>
                                <button 
                                    onClick={nextReview}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 border border-white/20 text-white active:scale-95 transition-all"
                                >
                                    <ChevronRight size={20} className="mb-1 opacity-50" />
                                    <span className="text-[8px] font-black tracking-widest uppercase">Next Review</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container-responsive mx-auto">
                <div className="mb-10 px-2">
                    <div className="flex justify-between items-end mb-12 px-4 md:px-0">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Customer Reviews</h2>
                            <p className="text-[8px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Verified Purchases from Our Community</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <NextLink href="/reviews/write" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 pb-1 hover:border-red-600 hover:text-red-600 transition-all">
                                Write a Review
                            </NextLink>
                            <NextLink href="/reviews" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 pb-1 hover:border-black hover:text-zinc-600 transition-all flex items-center gap-1">
                                View All <ArrowRight size={14} />
                            </NextLink>
                        </div>
                    </div>
                </div>

                <div className="relative group/review-scroller min-h-[300px]">
                    <button 
                         onClick={() => scroll('left')}
                        className="absolute -left-2 md:-left-20 top-1/2 -translate-y-1/2 z-[60] text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95 bg-white/10 rounded-full"
                    >
                        <ChevronLeft className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
                    </button>
                    <button 
                        onClick={() => scroll('right')}
                        className="absolute -right-2 md:-right-20 top-1/2 -translate-y-1/2 z-[60] text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95 bg-white/10 rounded-full"
                    >
                        <ChevronRight className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
                    </button>

                    {loading ? (
                        <div className="flex gap-4 overflow-x-hidden py-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-[280px] md:w-[400px] aspect-[4/5] bg-zinc-100 animate-pulse rounded-[2rem] shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div 
                            ref={scrollRef}
                            className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar py-4 snap-x snap-mandatory scroll-smooth px-4 md:px-0"
                        >
                            {displayReviews.map((item: any, idx: number) => {
                                const r = item.review || item;
                                const media = getMediaFromReview(item);
                                const hasMedia = media.length > 0;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => openModal(item, idx)}
                                        className="w-[280px] md:w-[400px] bg-white border border-zinc-200 flex flex-col group/card hover:shadow-xl transition-shadow duration-500 cursor-pointer shrink-0 snap-center"
                                    >
                                        <div className="h-[250px] md:h-[400px] bg-zinc-100 relative overflow-hidden border-b border-zinc-100">
                                            {hasMedia ? (
                                                <div className="w-full h-full relative">
                                                    {media[0].type === 'video' ? (
                                                        <video src={resolveMediaURL(media[0].url)} muted loop autoPlay playsInline className="w-full h-full object-cover transition-all duration-700" />
                                                    ) : (
                                                        <img src={resolveMediaURL(media[0].url)} alt="" className="w-full h-full object-cover transition-all duration-700" />
                                                    )}

                                                    {media.length > 1 && (
                                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 text-[10px] font-bold text-white uppercase tracking-widest rounded-md">
                                                            +{media.length - 1} More
                                                        </div>
                                                    )}

                                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold text-black uppercase tracking-widest rounded-md">
                                                        {media[0].type === 'video' ? 'Video Showcase' : 'Verified Photo'}
                                                    </div>

                                                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-2 transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500 shadow-2xl border border-zinc-100">
                                                            <Maximize2 size={16} className="text-zinc-900" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Experience Full Details</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                 <div className="w-full h-full flex items-center justify-center bg-zinc-50 p-6 md:p-8 whitespace-normal">
                                                     <p className="font-sans text-xl md:text-2xl text-zinc-300 text-center leading-tight">
                                                         &quot;{(r.review?.comment || r.comment)?.substring(0, 50)}...&quot;
                                                     </p>
                                                 </div>
                                            )}
                                        </div>

                                        <div className="p-6 md:p-8 flex flex-col flex-1 relative bg-white whitespace-normal">
                                            <div className="flex gap-0.5 mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill="currentColor" className="text-black" />
                                                ))}
                                            </div>

                                             <p className="font-sans text-sm md:text-base mb-6 line-clamp-6 leading-relaxed text-zinc-600 font-medium whitespace-normal">
                                                 &quot;{(r.review?.comment || r.comment)}&quot;
                                             </p>

                                            <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                                                 <div className="flex items-center gap-2">
                                                     <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg overflow-hidden uppercase border border-white/10">
                                                          {r.user?.avatar ? (
                                                              <img src={resolveMediaURL(r.user.avatar) || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                                          ) : (
                                                              <span className="text-[10px] font-black text-white">{(r.user?.firstName?.[0] || r.name?.[0] || "U").toUpperCase()}</span>
                                                          )}
                                                      </div>
                                                         <div>
                                                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 line-clamp-1">{r.review?.name || r.name}</p>
                                                             <div className="flex items-center gap-1">
                                                                 <CheckCircle2 size={9} className="text-blue-600 fill-blue-50" />
                                                                 <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest whitespace-nowrap">Verified Buyer</p>
                                                             </div>
                                                         </div>
                                                 </div>
                                                <div className="flex items-center justify-center text-black hover:text-zinc-600 transition-colors">
                                                    <ArrowUpRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeaturedReviews;
