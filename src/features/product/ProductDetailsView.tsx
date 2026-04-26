'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/context/ToastContext';
import { 
  Share2, Heart, ShoppingBag, ChevronRight, Star, Minus, Plus, 
  Instagram, Facebook, Twitter, MessageCircle, MoreHorizontal, 
  Send, Info, BadgePercent, Trash2, Zap, ArrowLeft, Camera, 
  Video, Play, Maximize2, Download, ExternalLink, Link as LinkIcon, 
  Home, X, Loader2, ChevronLeft, BellRing, Check, Sparkles, 
  ShieldCheck, RotateCcw, Lock, Award, CheckCircle2 
} from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { Skeleton } from '@/components/ui/Skeleton';
import Price from '@/components/shared/Price';
import { IProduct, IReview, IVariant } from '@/types/product';
import { client as api } from '@/lib/api/client';
import NotifyMeModal from '../shop/components/NotifyMeModal';
import RecentlyViewed from '@/components/shared/RecentlyViewed';
import ProductCard from '@/components/shared/ProductCard';
import { resolveMediaURL } from '@/utils/mediaUtils';


export const ProductDetailsView = () => {
  const params = useParams() as { id: string };
  const id = params?.id; 
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, toggleWishlist } = useAuthStore();
  const { addItem: addToCart } = useCartStore(); 
  const { addToast } = useToast();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);
  const [activeTab, setActiveTab] = useState('story');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const [ratingInput, setRatingInput] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewVideos, setReviewVideos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReviewIdx, setSelectedReviewIdx] = useState<number | null>(null);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [modalCommentExpanded, setModalCommentExpanded] = useState(false);
  const [expandedReviewTexts, setExpandedReviewTexts] = useState<Record<number, boolean>>({});
  const [sortOption, setSortOption] = useState('newest');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showSizeConsultant, setShowSizeConsultant] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitPreference, setFitPreference] = useState('Standard');
  const [aiRecommendation, setAiRecommendation] = useState<{ size: string; confidence: number; reason: string } | null>(null);
  const [fullReviews, setFullReviews] = useState<IReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [variantForcedImage, setVariantForcedImage] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reviewsRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  // Dynamic Delivery Logic
  const deliveryDate = useMemo(() => {
    if (!mounted) return '';
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [mounted]);

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const validateFile = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast(`File too large. Max ${type === 'video' ? '50MB' : '5MB'}`, "error");
      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (reviewImages.length + files.length > 10) {
      addToast("Maximum 10 images allowed per review", "warning");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        if (!validateFile(file, 'image')) continue;
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setReviewImages(prev => [...prev, data.filePath]);
      }
      addToast("Images uploaded successfully", "success");
    } catch (err) {
      addToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (reviewVideos.length + files.length > 5) {
      addToast("Maximum 5 videos allowed per review", "warning");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        if (!validateFile(file, 'video')) continue;
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setReviewVideos(prev => [...prev, data.filePath]);
      }
      addToast("Videos uploaded successfully", "success");
    } catch (err) {
      addToast("Video upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const scrollScroller = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const el = ref.current;
      const width = el.clientWidth;
      const scrollAmount = direction === 'left' ? -width * 0.8 : width * 0.8;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productPromise = api.get(`/products/${id}`);
        const settingsPromise = api.get('/settings');
        
        const [{ data }] = await Promise.all([productPromise, settingsPromise]);
        
        setProduct(data);
        const settingsData = (await settingsPromise).data;
        setSiteSettings(settingsData);
        
        setLoading(false);

        api.get(`/products/recommendations?category=${data.category}&exclude=${data._id}`)
          .then(recRes => setSuggestions(recRes.data || []))
          .catch(err => console.error("Rec fetch error:", err));

        if (typeof window !== 'undefined') {
          let history = [];
          try { history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); } catch (e) { history = []; }
          const updatedHistory = [
            { 
              _id: data._id, 
              name: data.name, 
              slug: data.slug, 
              image: data.image, 
              price: data.price,
              countInStock: data.countInStock ?? data.stock ?? data.qty ?? 0,
              variants: data.variants || []
            },
            ...(Array.isArray(history) ? history.filter((item: IProduct) => item._id !== data._id) : [])
          ].slice(0, 10);
          localStorage.setItem('recentlyViewed', JSON.stringify(updatedHistory));
          window.dispatchEvent(new Event('recentlyViewedUpdated'));
        }

        if (user && data._id) {
          api.post('/users/history', { productId: data._id }).catch(() => { });
        }
      } catch (err) { 
        console.error(err); 
        setLoading(false);
      }
    };
    if (id) fetchData();

    if (typeof window !== 'undefined') {
      const target = localStorage.getItem('scrollTarget');
      if (target === 'reviews') {
        setActiveTab('reviews');
        localStorage.removeItem('scrollTarget');
        setTimeout(() => {
          reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1000);
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (activeTab === 'reviews' && product?._id && fullReviews.length === 0) {
      const fetchFullReviews = async () => {
        try {
          setLoadingReviews(true);
          const { data } = await api.get(`/products/${product._id}/reviews/full`);
          setFullReviews(data);
          setLoadingReviews(false);
        } catch (err) {
          console.error("Failed to fetch full reviews", err);
          setLoadingReviews(false);
        }
      };
      fetchFullReviews();
    }
  }, [activeTab, product?._id, fullReviews.length]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const urlColor = searchParams.get('color');
      const urlSize = searchParams.get('size');

      if (urlColor || urlSize) {
        if (urlColor) setSelectedColor(urlColor);
        if (urlSize) setSelectedSize(urlSize);
      } else {
        const inStockVariant = product.variants.find(v => Number(v.stock ?? v.countInStock ?? v.qty ?? 0) > 0);
        const firstVariant = inStockVariant || product.variants[0];
        setSelectedColor(firstVariant.color ?? null);
        setSelectedSize(firstVariant.size ?? null);
      }
    }
  }, [product, searchParams]);

  const updateUrlParams = (color: string | null, size: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (color) params.set('color', color);
    if (size) params.set('size', size);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const colors = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return [];
    const colorMap = new Map();
    product.variants.forEach(v => {
      const colorKey = (v.color || '').trim();
      if (colorKey && !colorMap.has(colorKey.toLowerCase())) {
        colorMap.set(colorKey.toLowerCase(), { name: v.color, image: v.image || product.image });
      }
    });
    return Array.from(colorMap.values());
  }, [product]);

  const allSizes = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return [];
    const sizes = Array.from(new Set(product.variants.map(v => (v.size || '').trim()).filter(Boolean))) as string[];
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', 'ONE SIZE', 'FREE SIZE'];
    return sizes.sort((a, b) => {
      const indexA = order.indexOf(a.toUpperCase());
      const indexB = order.indexOf(b.toUpperCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [product]);

  const isSizeAvailable = (size: string) => {
    if (!product?.variants) return true;
    const variant = product.variants.find((v: IVariant) => v.size === size);
    return variant ? Number(variant.stock ?? variant.countInStock ?? variant.qty ?? 0) > 0 : false;
  };

// DERIVE SELECTED VARIANT IN RENDER (No state lag)
  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return undefined;
    return product.variants.find(v =>
      String(v.color || '').trim().toLowerCase() === String(selectedColor || '').trim().toLowerCase() &&
      String(v.size || '').trim().toLowerCase() === String(selectedSize || '').trim().toLowerCase()
    ) || undefined;
  }, [selectedColor, selectedSize, product]);

  // SMART PIVOT LOGIC: If a user picks a color/size that is OOS in the current combo,
  // but available in others, pivot them to an available one.
  useEffect(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return;

    // If current selection is OOS or non-existent
    const currentIsOOS = !selectedVariant || Number(selectedVariant.stock || 0) <= 0;

    if (currentIsOOS) {
      // Find FIRST available variant for the CURRENT color
      const autoVariant = product.variants.find(v =>
        String(v.color || '').trim().toLowerCase() === String(selectedColor || '').trim().toLowerCase() &&
        Number(v.stock ?? v.countInStock ?? v.qty ?? 0) > 0
      );

      if (autoVariant) {
        setSelectedSize(autoVariant.size ?? null);
      }
    }
  }, [selectedColor, product?.variants, selectedVariant, selectedSize]); // Only pivot on color change/stock change

  const currentPrice = Number(selectedVariant?.price || product?.price || 0);
  const currentStock = (product?.variants && product.variants.length > 0)
    ? (selectedVariant ? Number(selectedVariant.stock ?? selectedVariant.countInStock ?? selectedVariant.qty ?? 0) : 0)
    : Number(product?.countInStock || 0);
  const isOutOfStock = currentStock <= 0;

  const mediaItems = useMemo(() => {
    if (!product) return [];
    const items = [
      ...(product.image ? [{ type: 'image', url: resolveMediaURL(product.image) }] : []),
      ...(product.images || []).map((url: string) => ({ type: 'image', url: resolveMediaURL(url) })),
      ...(product.videos || []).map((url: string) => ({ type: 'video', url: resolveMediaURL(url) })),
      ...(product.video ? [{ type: 'video', url: resolveMediaURL(product.video) }] : [])
    ];
    return items;
  }, [product]);

  useEffect(() => {
    if (selectedVariant?.image) { setVariantForcedImage(selectedVariant.image); }
    else { setVariantForcedImage(null); }
  }, [selectedVariant]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return router.push('/login');
    toggleWishlist(product);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push('/login');
    if (!comment.trim()) return addToast("Please add a comment", "error");
    setSubmitting(true);
    try {
      await api.post(`/products/${product?._id}/reviews`,
        { rating: ratingInput, comment, images: reviewImages, videos: reviewVideos }
      );
      addToast("Shared with Community!", "success");
      if (typeof window !== 'undefined') {
        localStorage.setItem('scrollTarget', 'reviews');
        window.location.reload();
      }
    } catch (err: unknown) { 
      const errorMsg = err instanceof Error ? err.message : "Review failed";
      addToast(errorMsg, "error"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!product?.reviews) return dist;
    product.reviews.forEach(r => {
      const r_rating = Math.floor(r.rating);
      if (r_rating >= 1 && r_rating <= 5) dist[r_rating]++;
    });
    return dist;
  }, [product]);

  const isWishlisted = user?.wishlist?.some((item: IProduct) => (item._id || item).toString() === product?._id?.toString());

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) return addToast("Please login to vote", "error");
    if (!product) return;
    try {
      const { data } = await api.put(`/products/${product._id}/reviews/${reviewId}/helpful`, {});
      const updatedReviews = (product.reviews || []).map(r => {
        if (r._id === reviewId) {
          const currentHelpful = r.helpful || [];
          const newHelpful = data.isHelpful ? [...currentHelpful, user._id] : currentHelpful.filter(uId => uId !== user._id);
          return { ...r, helpful: newHelpful };
        }
        return r;
      });
      setProduct({ ...product, reviews: updatedReviews });
    } catch (err) { addToast("Failed to vote", "error"); }
  };

  const sortedReviews = useMemo(() => {
    const reviewsSource = product?.reviews || [];
    const reviews = reviewsSource.filter((r: IReview) => r.isApproved !== false);
    switch (sortOption) {
      case 'newest': return reviews.reverse();
      case 'oldest': return reviews;
      case 'highest': return reviews.sort((a, b) => b.rating - a.rating);
      case 'lowest': return reviews.sort((a, b) => a.rating - b.rating);
      case 'helpful': return reviews.sort((a, b) => (b.helpful?.length || 0) - (a.helpful?.length || 0));
      default: return reviews.reverse();
    }
  }, [product?.reviews, sortOption]);

  if (loading) return (
    <div className="container-responsive animate-in fade-in duration-700 px-4 md:px-8 py-10">
      <Skeleton className="h-4 w-48 mb-10 rounded-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-square w-full rounded-[2.5rem]" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container-responsive py-40 text-center flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6"><X size={40} className="text-zinc-200" /></div>
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Product Not Found</h2>
      <p className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8 max-w-sm">The artifact you are looking for is currently unavailable in our studio.</p>
      <Link href="/shop" className="px-10 py-4 bg-zinc-900 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Explore Collection</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen px-4 md:px-6 pb-20 font-sans text-[#1a1a1a] page-top selection:bg-black selection:text-white">
      
      <AnimatePresence>
        {selectedReviewIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 md:p-10"
            onClick={() => { setSelectedReviewIdx(null); setSelectedMediaIdx(0); setModalCommentExpanded(false); }}
          >
            <button className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors p-2 z-[120]"><X size={32} /></button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReviewIdx((prev) => (prev! - 1 + sortedReviews.length) % sortedReviews.length);
                setSelectedMediaIdx(0);
                setModalCommentExpanded(false);
              }}
              className="fixed left-2 md:left-12 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 group flex flex-col items-center gap-2"
            >
              <ChevronLeft size={48} strokeWidth={1.5} className="md:w-16 md:h-16" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">PREV</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReviewIdx((prev) => (prev! + 1) % sortedReviews.length);
                setSelectedMediaIdx(0);
                setModalCommentExpanded(false);
              }}
              className="fixed right-2 md:right-12 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all z-[120] hover:scale-125 group flex flex-col items-center gap-2"
            >
              <ChevronRight size={48} strokeWidth={1.5} className="md:w-16 md:h-16" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">NEXT</span>
            </button>

            <div className="relative w-full md:max-w-7xl bg-white md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] mx-auto no-scrollbar shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const activeReviewItem = sortedReviews[selectedReviewIdx!];
                const videos = activeReviewItem?.videos || (activeReviewItem?.video ? [activeReviewItem.video] : []);
                const images = activeReviewItem?.images || (activeReviewItem?.reviewImage ? [activeReviewItem.reviewImage] : []);
                const allMedia = [
                  ...videos.map(v => ({ type: 'video', url: v })),
                  ...images.map(i => ({ type: 'image', url: i }))
                ];
                const currentMedia = allMedia[selectedMediaIdx] || null;

                return (
                  <>
                    <div className={`w-full ${currentMedia ? 'md:w-[60%]' : 'hidden'} flex flex-col md:flex-row bg-zinc-950 md:bg-black shrink-0 overflow-hidden relative`}>
                      
                      {/* 1. MOBILE HEADER (Sticky) */}
                      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950 z-[140] shrink-0">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-black">
                                  {(activeReviewItem.name || "V").charAt(0)}
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">{activeReviewItem.name || "Verified Buyer"}</p>
                                  <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={8} fill="currentColor" className="text-white" />
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <button 
                              onClick={() => setSelectedReviewIdx(null)}
                              className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-all"
                          >
                              <X size={20} />
                          </button>
                      </div>

                      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden h-[50vh] md:h-full">
                        {currentMedia && (
                          <>
                            {currentMedia.type === 'video' ? (
                              <video src={resolveMediaURL(currentMedia.url)} controls autoPlay className="w-full h-full object-contain" />
                            ) : (
                              <img src={resolveMediaURL(currentMedia.url)} alt="Review Media" className="w-full h-full object-contain" />
                            )}
                            
                            {/* MOBILE MEDIA NAV OVERLAYS (Meesho Style) */}
                            <div className="absolute inset-y-0 left-0 w-1/4 z-30 flex items-center justify-start pl-4 md:hidden" onClick={(e) => { e.stopPropagation(); setSelectedMediaIdx((prev) => (prev - 1 + allMedia.length) % allMedia.length); }}>
                                <div className="text-white/50">
                                    <ChevronLeft size={24} />
                                </div>
                            </div>
                            <div className="absolute inset-y-0 right-0 w-1/4 z-30 flex items-center justify-end pr-4 md:hidden" onClick={(e) => { e.stopPropagation(); setSelectedMediaIdx((prev) => (prev + 1) % allMedia.length); }}>
                                <div className="text-white/50">
                                    <ChevronRight size={24} />
                                </div>
                            </div>

                            {/* DESKTOP PRODUCT OVERLAY */}
                            <div className="hidden md:block absolute top-8 left-8 z-30 pointer-events-none">
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                                    <div className="w-7 h-7 rounded-lg bg-white overflow-hidden border border-white/5 shrink-0">
                                        <img src={resolveMediaURL(product.images?.[0] || product.image)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[6px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-0.5">Reviewing</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white truncate max-w-[100px]">{product.name}</p>
                                    </div>
                                </div>
                            </div>

                            {allMedia.length > 1 && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedMediaIdx((prev) => (prev - 1 + allMedia.length) % allMedia.length); }} className="hidden md:flex absolute left-6 bottom-10 p-3 text-white/60 hover:text-white transition-all z-20"><ChevronLeft size={20} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedMediaIdx((prev) => (prev + 1) % allMedia.length); }} className="hidden md:flex absolute right-6 bottom-10 p-3 text-white/60 hover:text-white transition-all z-20"><ChevronRight size={20} /></button>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">{allMedia.map((_, i) => <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === selectedMediaIdx ? 'bg-white scale-125' : 'bg-white/20'}`} />)}</div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`w-full ${currentMedia ? 'md:w-[40%]' : 'md:w-full'} p-6 md:p-14 flex flex-col bg-zinc-950 md:bg-white shrink-0 md:overflow-y-auto no-scrollbar relative flex-1`}>
                      <div className="hidden md:flex items-center gap-4 mb-6 pb-6 border-b border-zinc-50 pt-2">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs text-white shadow-xl">{(activeReviewItem.name || "V").charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-black uppercase tracking-widest text-zinc-900 leading-none">{activeReviewItem.name || "Verified Buyer"}</p>
                            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < activeReviewItem.rating ? "black" : "none"} className={i < activeReviewItem.rating ? "text-black" : "text-zinc-100"} />)}</div>
                          </div>
                          <div className="flex items-center gap-2"><CheckCircle2 size={10} className="text-blue-600 fill-blue-50" /><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Verified Perspective</span></div>
                        </div>
                      </div>

                      <div className="md:hidden flex items-center gap-3 p-3 mb-6 bg-white/5 rounded-2xl border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-white/5 shrink-0"><img src={resolveMediaURL(product.images?.[0] || product.image)} alt="" className="w-full h-full object-cover" /></div>
                        <div className="min-w-0"><p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">Product Reference</p><p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{product.name}</p></div>
                      </div>

                      <div className="flex-grow flex flex-col justify-start">
                        {activeReviewItem.title && <h3 className="text-sm md:text-lg font-black uppercase tracking-tight mb-4 leading-tight text-white md:text-zinc-900">{activeReviewItem.title}</h3>}
                        <p className="text-zinc-300 md:text-zinc-900 leading-[1.8] text-[13px] md:text-base font-medium whitespace-pre-line">&quot;{activeReviewItem.comment}&quot;</p>
                        <time className="text-[8px] text-zinc-500 md:text-zinc-400 font-bold uppercase tracking-widest whitespace-nowrap pt-6 mt-auto">
                          {mounted ? new Date(activeReviewItem.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                        </time>
                      </div>

                      <div className="border-t border-white/5 md:border-zinc-50 pt-8 mt-6">
                        <button onClick={(e) => { e.stopPropagation(); handleHelpfulVote(activeReviewItem._id); }} className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[8px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${user && activeReviewItem.helpful?.includes(user._id) ? 'bg-white text-black shadow-xl scale-[1.02]' : 'bg-white/5 md:bg-zinc-100 text-white md:text-zinc-500 hover:bg-white hover:text-black hover:shadow-lg'}`}>
                          <Heart size={14} fill={user && activeReviewItem.helpful?.includes(user._id) ? "currentColor" : "none"} />
                          <span>Helpful ({activeReviewItem.helpful?.length || 0})</span>
                        </button>
                      </div>

                      {/* MOBILE REVIEW NAVIGATION */}
                      <div className="md:hidden grid grid-cols-2 gap-3 mt-4">
                          <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedReviewIdx((prev) => (prev! - 1 + sortedReviews.length) % sortedReviews.length); setSelectedMediaIdx(0); }}
                              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all text-center"
                          >
                              <ChevronLeft size={20} className="mb-1 opacity-50" />
                              <span className="text-[7px] font-black tracking-widest uppercase">Previous Review</span>
                          </button>
                          <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedReviewIdx((prev) => (prev! + 1) % sortedReviews.length); setSelectedMediaIdx(0); }}
                              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 border border-white/20 text-white active:scale-95 transition-all text-center"
                          >
                              <ChevronRight size={20} className="mb-1 opacity-50" />
                              <span className="text-[7px] font-black tracking-widest uppercase">Next Review</span>
                          </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotifyMeModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} product={product} variant={selectedVariant} />

      <div className="max-w-6xl mx-auto px-4 md:px-8 mb-10">
        <Breadcrumbs items={[
          { label: 'Shop', path: '/shop' },
          { label: product.category, path: `/shop?category=${product.category}` },
          { label: product.name, path: `/product/${product.slug}` }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-16 relative">
          
          <div className="lg:col-span-6 flex gap-6">
            <div className="hidden xl:flex flex-col gap-3 sticky top-32 h-fit w-16 shrink-0">
              {mediaItems.map((item, i) => (
                <button key={i} onClick={() => { setActiveMediaIndex(i); setVariantForcedImage(null); }} className={`aspect-[3/4] rounded-lg overflow-hidden border transition-all duration-300 bg-zinc-50 ${activeMediaIndex === i && !variantForcedImage ? 'border-zinc-900 shadow-sm scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  {item.type === 'video' ? <div className="w-full h-full flex items-center justify-center bg-zinc-100"><Play size={12} className="text-zinc-400" /></div> : <img src={item.url} className="w-full h-full object-cover" alt="" />}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-10">
              <div 
                className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-zinc-50 cursor-zoom-in group/main"
                onMouseMove={(e) => {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  setMousePos({ x: ((e.pageX - left) / width) * 100, y: ((e.pageY - top) / height) * 100 });
                }}
                onMouseEnter={() => setIsZooming(true)} onMouseLeave={() => setIsZooming(false)}
              >
                <button onClick={handleWishlist} className={`absolute top-6 right-6 z-20 p-4 rounded-2xl transition-all shadow-xl backdrop-blur-md ${isWishlisted ? 'bg-zinc-900/80 text-white' : 'bg-white/50 text-zinc-900 hover:bg-white'}`}><Heart size={20} fill={isWishlisted ? "currentColor" : "none"} /></button>
                <AnimatePresence mode="wait">
                  <motion.div key={variantForcedImage || activeMediaIndex} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, ease: "circOut" }} className="w-full h-full">
                    {mediaItems[activeMediaIndex]?.type === 'video' && !variantForcedImage ? (
                      <video src={mediaItems[activeMediaIndex]?.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <div className="w-full h-full relative">
                        <img 
                          src={variantForcedImage || mediaItems[activeMediaIndex]?.url || resolveMediaURL(product.image)} 
                          className={`w-full h-full object-cover transition-all duration-700 ${isZooming ? 'scale-[2.5]' : 'scale-100'}`} 
                          style={isZooming ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
                          alt="" 
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:col-span-6 space-y-8 md:space-y-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4"><span className="text-[10px] md:text-sm font-black uppercase tracking-mega text-zinc-400">{product.category}</span><span className="w-1 h-1 bg-zinc-200 rounded-full" /><span className="text-[10px] md:text-sm font-black uppercase tracking-mega text-zinc-400">{product.subcategory}</span></div>
              <div role="heading" aria-level={1} className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-tighter text-zinc-900">
              {product.name}
            </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={scrollToReviews} className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(product.rating || 5) ? "currentColor" : "none"} />)}</button>
              <button onClick={scrollToReviews} className="text-[8px] md:text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-black">{product.numReviews} Verified Reviews</button>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="space-y-3">
                <h3 className="text-[10px] md:text-sm font-black uppercase text-zinc-900 border-b border-zinc-100 pb-2">Description</h3>
                <p className="text-zinc-600 text-base md:text-lg leading-relaxed font-medium">&quot;{product.description}&quot;</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] md:text-sm font-black uppercase text-zinc-900 border-b border-zinc-100 pb-2">Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {(product.specs && product.specs.length > 0 ? product.specs : [
                    { key: 'Craftsmanship', value: 'Bespoke' }, { key: 'Edition', value: 'Limited Run' }, { key: 'Ethics', value: 'Sustainable' }, { key: 'Shipping', value: 'Priority' }
                  ]).map((spec, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 md:border-0"><span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest">{spec.key}</span><span className="text-[11px] md:text-sm font-black text-zinc-900 uppercase tracking-tight">{spec.value}</span></div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    Artifacts can be returned within 7 days of delivery if they are in &quot;original, unused condition&quot; with all tags intact. 
                </p>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-2 bg-zinc-50 p-4 rounded-[1.2rem] border border-zinc-100">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-5xl font-black text-zinc-900 tracking-tighter">
                  <Price amount={currentPrice} />
                </span>
                {product && currentPrice < product.price * 1.2 && (
                  <del className="text-zinc-300 text-lg md:text-2xl font-bold">
                    <Price amount={product.price * 1.4} />
                  </del>
                )}
              </div>
              <p className="text-[8px] md:text-xs font-black text-green-600 uppercase tracking-mega">
                Free Delivery Across India
              </p>
            </div>

            {colors.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-mega text-zinc-400 mb-4">Select Style</h4>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color, idx) => (
                    <button key={idx} onClick={() => { setSelectedColor(color.name); updateUrlParams(color.name, selectedSize); }} className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300 ${selectedColor === color.name ? 'border-zinc-900 scale-110 shadow-md' : 'border-transparent opacity-60'}`}><div className="w-full h-full rounded-full overflow-hidden border border-zinc-100 p-0.5"><img src={resolveMediaURL(color.image)} className="w-full h-full object-cover rounded-full" alt={color.name} /></div>{selectedColor === color.name && <div className="absolute -top-1 -right-1 bg-black text-white p-1 rounded-full border-2 border-white"><Check size={8} /></div>}</button>
                  ))}
                </div>
              </div>
            )}

            {allSizes.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-mega text-zinc-400 mb-4">Select Size</h4>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size, idx) => {
                    const isOOS = !isSizeAvailable(size);
                    return (
                      <button key={idx} disabled={!!isOOS} onClick={() => { setSelectedSize(size); updateUrlParams(selectedColor, size); }} className={`py-2 px-4 rounded-xl border-2 font-black text-[9px] md:text-xs transition-all duration-300 ${selectedSize === size ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-900 border-zinc-100 hover:border-zinc-900'} ${isOOS ? 'opacity-20 cursor-not-allowed' : 'active:scale-95'}`}>{size}</button>
                    );
                  })}
                </div>
                <button onClick={() => setShowSizeConsultant(true)} className="w-full h-11 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-mega text-[9px] md:text-[10px] shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"><Sparkles size={16} /> AI Size Consultant</button>
              </div>
            )}

            <div className="flex flex-col gap-6 pt-8 border-t border-zinc-100">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-xs font-black uppercase tracking-widest text-zinc-500">In Stock</span>
                  </div>
                </div>
              </div>
            </div>

            {!isOutOfStock ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                  <span className="text-sm md:text-xs font-black uppercase tracking-widest text-zinc-400">Quantity</span>
                  <div className="flex items-center gap-6">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-zinc-600 hover:text-black transition-colors"><Minus size={16} /></button>
                    <span className="font-black text-sm w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(currentStock || 10, quantity + 1))} className="text-zinc-600 hover:text-black transition-colors"><Plus size={16} /></button>
                  </div>
                </div>

                {/* RELOCATED TRUST TILES (Compact for mobile side column) */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                        <div className="flex flex-col items-center text-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                           <ShieldCheck size={16} strokeWidth={1.5} className="text-zinc-900" />
                           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tight text-zinc-900 leading-none">Secure<br/>Checkout</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                           <RotateCcw size={16} strokeWidth={1.5} className="text-zinc-900" />
                           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tight text-zinc-900 leading-none">7 Days<br/>Return</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                           <Lock size={16} strokeWidth={1.5} className="text-zinc-900" />
                           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tight text-zinc-900 leading-none">Secured<br/>Payment</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                           <Award size={16} strokeWidth={1.5} className="text-zinc-900" />
                           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tight text-zinc-900 leading-none">Authentic<br/>Product</span>
                        </div>
                    </div>

                <div className="hidden lg:flex flex-col space-y-3">
                  <button
                    onClick={() => { addToCart({ ...product, product: product._id, price: currentPrice, selectedVariant, quantity }); addToast("Added to Bag", "success"); }}
                    className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-base md:text-xs hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
                  >
                    <ShoppingBag size={20} /> Add to Bag
                  </button>
                  <button
                    onClick={() => { sessionStorage.setItem('checkoutSingleItem', JSON.stringify({ _id: product._id, product: product, name: product.name, price: currentPrice, image: variantForcedImage || product.image, selectedVariant: selectedVariant, quantity: quantity })); router.push('/checkout'); }}
                    className="w-full h-16 bg-white border-2 border-black text-black rounded-2xl font-black uppercase tracking-widest text-base md:text-xs hover:bg-black hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <ShieldCheck size={20} /> Secure Checkout
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowWaitlistModal(true)} className="w-full h-16 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-base md:text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl lg:flex hidden"><BellRing size={20} /> Waitlist Enrollment</button>
            )}
          </div>
        </div>
      </div>

      {!isOutOfStock ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-zinc-100 p-4 z-[100] lg:hidden animate-in slide-in-from-bottom-full duration-700">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex-1">
              <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400 mb-0">Premium Access</p>
              <Price amount={currentPrice} className="!text-sm font-black text-zinc-900 tracking-tighter" />
            </div>
            <div className="flex-[2.5] flex gap-2">
              <button
                onClick={() => { addToCart({ ...product, product: product._id, price: currentPrice, selectedVariant, quantity }); addToast("Added to Bag", "success"); }}
                className="flex-1 h-10 bg-zinc-100 text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 transition-all border border-zinc-200"
              >
                <ShoppingBag size={10} />
              </button>
              <button
                onClick={() => { sessionStorage.setItem('checkoutSingleItem', JSON.stringify({ _id: product._id, product: product, name: product.name, price: currentPrice, image: variantForcedImage || product.image, selectedVariant: selectedVariant, quantity: quantity })); router.push('/checkout'); }}
                className="flex-[3] h-10 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xl"
              >
                <Zap size={10} fill="currentColor" /> Secure Checkout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-zinc-100 p-4 z-[100] lg:hidden">
          <button onClick={() => setShowWaitlistModal(true)} className="w-full h-14 bg-amber-400 text-black rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg">
            <BellRing size={16} /> Join Waitlist
          </button>
        </div>
      )}

      <div className="container-responsive">
        <div ref={reviewsRef} className="mt-32 space-y-12">
          <div className="flex justify-center border-b border-zinc-100 overflow-x-auto no-scrollbar md:justify-start">
            {['story', 'reviews'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-3 md:px-10 md:py-6 text-[11px] md:text-sm font-black uppercase tracking-widest relative transition-all ${activeTab === t ? 'text-black' : 'text-zinc-400 hover:text-black'}`}>{t === 'story' ? 'Product Story' : `Review (${product.numReviews})`}{activeTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />}</button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'story' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl mx-auto py-12 md:py-20 text-center space-y-12">
                <div className="space-y-4"><div className="flex justify-center items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400"><div className="h-[1px] w-12 bg-zinc-900" /> The Slook Philosophy <div className="h-[1px] w-12 bg-zinc-900" /></div><h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none">The Art of <span className="text-zinc-400">Creation</span></h2></div>
                <p className="text-zinc-600 text-lg md:text-xl leading-relaxed font-medium max-w-3xl mx-auto px-4">
                  {product.richDescription || product.story || `Every ${product.name} in our collection is a testament to the pursuit of perfection. Meticulously crafted with a focus on form, function, and the subtle interplay of materials, this item embodies our philosophy of elevated minimalism.`}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-zinc-100">
                  {[
                    { title: 'Technical Precision', desc: 'Refined for an unparalleled experience.' },
                    { title: 'Material Excellence', desc: 'Sourced from the finest local mills.' },
                    { title: 'Authentic Design', desc: 'Guaranteed quality from our core studio.' }
                  ].map((feature, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{feature.title}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold tracking-tight">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-40 space-y-6">
                    <Loader2 className="w-12 h-12 text-zinc-200 animate-spin" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Synchronizing Perspective...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-4 space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-baseline gap-2 md:gap-4">
                          <h2 className="text-6xl md:text-8xl font-black text-zinc-900 tracking-tighter">{(product.rating || 0).toFixed(1)}</h2>
                          <div className="flex flex-col gap-1">
                            <div className="flex text-black">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(product.rating || 5) ? "currentColor" : "none"} />)}</div>
                            <p className="font-black uppercase tracking-widest text-zinc-400" style={{ fontSize: 'clamp(8px, 2vw, 12px)' }}>Based on {product.numReviews} Verified Experiences</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDistribution[star] || 0;
                            const percentage = product.numReviews > 0 ? (count / product.numReviews) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-4 group cursor-pointer">
                                <span className="font-black text-zinc-900 w-2" style={{ fontSize: 'clamp(8px, 2vw, 12px)' }}>{star}</span>
                                <div className="flex-1 h-1.5 md:h-2 bg-zinc-100 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: 'circOut' }} className="h-full bg-zinc-900" />
                                </div>
                                <span className="font-black text-zinc-300 group-hover:text-zinc-900 transition-colors w-6" style={{ fontSize: 'clamp(8px, 2vw, 12px)' }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4 md:space-y-6 bg-zinc-50 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-zinc-100">
                        <div className="text-sm font-black uppercase tracking-widest text-zinc-900">Share Your Experience</div>
                        <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map(n => <Star key={n} onClick={() => setRatingInput(n)} size={24} className={`${ratingInput >= n ? 'fill-zinc-900 text-zinc-900' : 'text-zinc-200'} cursor-pointer transition-all hover:scale-110 active:scale-90`} />)}</div>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Experience details..." className="w-full bg-white border border-zinc-200 rounded-xl p-5 text-sm h-32 outline-none focus:border-zinc-900 transition-all resize-none shadow-inner" />

                        {(reviewImages.length > 0 || reviewVideos.length > 0) && (
                          <div className="flex flex-wrap gap-3">
                            {reviewImages.map((img, idx) => (
                              <div key={`img-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                                <button onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"><X size={10} /></button>
                              </div>
                            ))}
                            {reviewVideos.map((vid, idx) => (
                              <div key={`vid-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 bg-black shadow-sm">
                                <video src={vid} className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Play size={12} fill="white" className="text-white" /></div>
                                <button onClick={() => setReviewVideos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors pointer-events-auto z-10"><X size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold uppercase tracking-widest text-xs py-3.5 cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all hover:-translate-y-0.5 shadow-sm">
                            {uploading ? <Loader2 size={16} className="animate-spin text-zinc-400" /> : <Camera size={16} />}
                            <span>{uploading ? 'Wait' : 'Add Photos'}</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                          </label>
                          <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold uppercase tracking-widest text-xs py-3.5 cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all hover:-translate-y-0.5 shadow-sm">
                            {uploading ? <Loader2 size={16} className="animate-spin text-zinc-400" /> : <Video size={16} />}
                            <span>{uploading ? 'Wait' : 'Add Videos'}</span>
                            <input type="file" multiple accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploading} />
                          </label>
                        </div>
                        <button onClick={handleReviewSubmit} disabled={submitting || uploading} className="w-full bg-zinc-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl active:scale-95 transition-all py-4 flex justify-center items-center gap-2">
                          {submitting || uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          {submitting || uploading ? 'Processing...' : 'Submit Experience'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-12">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-8">
                        <div className="text-xl font-black tracking-tight text-zinc-900 uppercase">Community Stories</div>
                        <select onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-sm font-black uppercase tracking-widest outline-none cursor-pointer border-b-2 border-zinc-900 pb-1">
                          <option value="newest">Newest</option>
                          <option value="highest">Best Rating</option>
                          <option value="helpful">Helpful</option>
                        </select>
                      </div>
                      <div className="space-y-16">
                        {sortedReviews.length > 0 ? (
                          sortedReviews.map((rev, i) => (
                            <div key={i} className="space-y-6 group">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-[9px] text-white border border-zinc-800 shadow-sm">{rev.name?.charAt(0)}</div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <p className="font-black text-[10px] md:text-xs uppercase tracking-widest text-zinc-900 leading-none">{rev.name}</p>
                                      {rev.comment && rev.comment.length > 100 && (
                                        <button onClick={(e) => { e.stopPropagation(); setExpandedReviewTexts(prev => ({ ...prev, [i]: !prev[i] })); }} className="text-[8px] md:text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-black transition-colors">
                                          {expandedReviewTexts[i] ? 'Less' : 'More'}
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={10} className={j < rev.rating ? 'fill-zinc-900 text-zinc-900' : 'text-zinc-200'} />)}</div>
                                  </div>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                  {mounted ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                                </span>
                              </div>
                              <div className="group/text">
                                {rev.title && <h3 className="font-bold text-[9px] mb-1 text-zinc-900 border-l-2 border-zinc-100 pl-4 ml-5">{rev.title}</h3>}
                                <p className={`text-[11px] md:text-sm text-zinc-600 leading-relaxed border-l-2 border-zinc-100 pl-4 ml-5 ${expandedReviewTexts[i] ? '' : 'line-clamp-4'}`}>&quot;{rev.comment}&quot;</p>
                              </div>
                              <div className="flex gap-2 ml-10">
                                {(() => {
                                  const videos = rev.videos || (rev.video ? [rev.video] : []);
                                  const images = rev.images || (rev.reviewImage ? [rev.reviewImage] : []);
                                  const allRevMedia = [...videos.map((v: string) => ({ type: 'video', url: v })), ...images.map((img: string) => ({ type: 'image', url: img }))];
                                  return allRevMedia.slice(0, 15).map((media, idx) => (
                                    <div key={idx} onClick={(e) => { e.stopPropagation(); setSelectedReviewIdx(i); setSelectedMediaIdx(idx); }} className="w-16 h-20 rounded-lg overflow-hidden shadow-sm border border-zinc-100 hover:scale-105 transition-all cursor-pointer relative">
                                      {media.type === 'video' ? (
                                        <>
                                          <video src={resolveMediaURL(media.url)} className="w-full h-full object-cover opacity-60 bg-black" />
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-5 h-5 bg-white/30 backdrop-blur rounded-full flex items-center justify-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <img src={resolveMediaURL(media.url)} className="w-full h-full object-cover" alt="" />
                                      )}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center bg-zinc-50 rounded-[2rem] border border-zinc-100 animate-in fade-in duration-700">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><MessageCircle size={32} className="text-zinc-200" /></div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 mb-2">No Community Stories Yet</h3>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 max-w-xs mx-auto">Be the first to share your experience with this artifact.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <RecentlyViewed currentProductId={product?._id} />

      {suggestions.length > 0 && (
        <section className="container-responsive py-12 md:py-24 relative bg-zinc-50 border-t border-zinc-100 mt-24">
          <div className="flex justify-between items-end mb-12 px-2">
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Recommended Artifacts</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-1">Curated for your aesthetic</p>
            </div>
            <Link href="/shop" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors border-b border-zinc-200">View All</Link>
          </div>
          <div className="relative flex items-center group/scroller">
            <button onClick={() => scrollScroller(recommendedRef, 'left')} className="absolute -left-2 md:-left-20 top-[30%] md:top-[35%] -translate-y-1/2 z-50 text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95">
              <ChevronLeft className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
            </button>
            <button onClick={() => scrollScroller(recommendedRef, 'right')} className="absolute -right-2 md:-right-20 top-[30%] md:top-[35%] -translate-y-1/2 z-50 text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95">
              <ChevronRight className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
            </button>
            <div ref={recommendedRef} className="flex gap-3 md:gap-4 w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-0 pb-10">
              {suggestions.map((item) => (
                <div key={item._id} className="w-[181.03px] md:w-auto md:min-w-[20%] lg:min-w-[16%] snap-start md:snap-start flex-shrink-0">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white p-3 bg-white/10 rounded-full transition-colors z-[210]"><X size={32} /></button>
          <div className="relative w-full max-w-6xl h-full flex items-center justify-center p-12" onClick={e => e.stopPropagation()}>
            <button disabled={lightboxIndex === 0} onClick={() => setLightboxIndex(prev => prev - 1)} className="absolute left-8 p-4 text-white transition-all disabled:opacity-0"><ChevronLeft size={32} /></button>
            <img src={resolveMediaURL(mediaItems[lightboxIndex]?.url)} className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500 select-none" alt="" />
            <button disabled={lightboxIndex === mediaItems.length - 1} onClick={() => setLightboxIndex(prev => prev + 1)} className="absolute right-8 p-4 text-white transition-all disabled:opacity-0"><ChevronRight size={32} /></button>
            <div className="absolute bottom-12 flex gap-3">
              {mediaItems.map((_, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)} className={`w-2 h-2 rounded-full transition-all ${lightboxIndex === i ? 'bg-white scale-150' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSizeConsultant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-10 bg-zinc-950 text-white relative">
                <button onClick={() => setShowSizeConsultant(false)} className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"><X size={20} /></button>
                <div className="flex items-center gap-4 mb-2"><Award size={32} className="text-amber-400" /><h2 className="text-2xl font-black italic tracking-tighter uppercase italic">AI Size <span className="text-amber-400">Consultant</span></h2></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Neural Fit Analysis Engine</p>
              </div>
              <div className="p-10 space-y-8">
                {!aiRecommendation ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Height (cm)</label><input type="number" placeholder="e.g. 180" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-black transition-all font-bold" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Weight (kg)</label><input type="number" placeholder="e.g. 75" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-black transition-all font-bold" /></div>
                    </div>
                    <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center block">Fit Preference</label><div className="flex gap-2">{['Slim', 'Standard', 'Oversized'].map(f => <button key={f} onClick={() => setFitPreference(f)} className={`flex-1 py-4 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${fitPreference === f ? 'bg-black text-white shadow-xl border-black' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300'}`}>{f}</button>)}</div></div>
                    <button
                      disabled={!height || !weight}
                      onClick={() => {
                        const h = parseInt(height);
                        const w = parseInt(weight);
                        let baseSize = 'M';
                        if (h > 185 || w > 85) baseSize = 'XL';
                        else if (h > 175 || w > 70) baseSize = 'L';
                        else if (h < 165 || w < 55) baseSize = 'S';
                        setAiRecommendation({
                          size: baseSize,
                          confidence: 94,
                          reason: `Based on your ${fitPreference.toLowerCase()} preference and BMI profile.`
                        });
                      }}
                      className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm md:text-xs shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-20"
                    >
                      Analyze Profile
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-8 py-4 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-zinc-950 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto shadow-2xl border-4 border-amber-400/20">{aiRecommendation.size}</div>
                    <div className="space-y-2"><h4 className="text-xs font-black uppercase tracking-mega">Optimal Calibration Found</h4><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">&quot;{aiRecommendation.reason}&quot;</p></div>
                    <div className="flex gap-4"><button onClick={() => setAiRecommendation(null)} className="flex-1 py-4 text-[10px] font-black uppercase bg-zinc-50 rounded-xl text-zinc-400">Recalibrate</button><button onClick={() => { setSelectedSize(aiRecommendation.size); setShowSizeConsultant(false); setAiRecommendation(null); }} className="flex-[2] py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Apply {aiRecommendation.size}</button></div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
