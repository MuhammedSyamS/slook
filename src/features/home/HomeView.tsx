'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/shared/SafeImage';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, Shirt, Smartphone, Watch, Home as HomeIcon, ShoppingBag, Trophy, Gamepad, Car, Zap } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import ProductCard from '@/components/shared/ProductCard';
import FeaturedReviews from '@/components/home/FeaturedReviews';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';
import Reveal from '@/components/shared/Reveal';
import Marquee from '@/components/shared/Marquee';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AIStylist } from '@/components/home/AIStylist';

export const HomeView = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [communityLooks, setCommunityLooks] = useState<any[]>([]);
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 1000], [1.1, 1.6]);
  const heroY = useTransform(scrollY, [0, 1000], [0, 100]);

  const newArrivalRef = useRef<HTMLDivElement>(null);
  const bestSellersSectionRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const fashionTrendingRef = useRef<HTMLDivElement>(null);
  const techLatestRef = useRef<HTMLDivElement>(null);
  const accessoriesPrimeRef = useRef<HTMLDivElement>(null);
  const homeEssentialsRef = useRef<HTMLDivElement>(null);
  const communityLooksRef = useRef<HTMLDivElement>(null);
  const allProductsRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    if (!settings) return [];
    
    const raw = settings?.heroSlides || [];
    const valid = raw.filter((s: any) => s && (s.img || s.image));
    
    if (valid.length === 0) {
      return [
        { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000", key: 'f1', title: 'Curated Excellence', subtitle: 'Studio Series' },
        { img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000", key: 'f2', title: 'Modern Artifacts', subtitle: 'Modern Series' },
        { img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000", key: 'f3', title: 'Studio Series', subtitle: 'Modern Series' }
      ];
    }
    
    return valid.map((s: any, i: number) => ({
      ...s,
      img: resolveMediaURL(s.img || s.image),
      key: `hero-${i}-${(s.img || s.image || '').slice(-10)}`
    }));
  }, [settings]);

  const scrollToProducts = () => {
    trendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- OPTIMIZED DATA FETCHING (Parallel & Non-blocking) ---
  const [homeData, setHomeData] = useState<any>({ trending: [], newArrivals: [], bestSellers: [] });
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. CRITICAL DATA: Products & Essential Config
    const fetchCriticalData = async () => {
      try {
        setLoading(true);
        const [homeRes, allRes] = await Promise.all([
          api.get('/products/home'),
          api.get('/products?pageSize=40', { params: { t: Date.now() } }) // Increased from 20 for 'fuller' feel
        ]);

        setHomeData(homeRes.data);
        if (allRes.data?.products) {
          setAllProducts(allRes.data.products);
        }
      } catch (err: any) {
        console.error("HOME CRITICAL FETCH ERROR:", err);
        setError("Network connection unstable. Artifacts might be missing.");
      } finally {
        setLoading(false);
      }
    };

    // 2. NON-CRITICAL DATA: Background loads (Looks, Recommendations)
    const fetchNonCriticalData = async () => {
       try {
         const { data } = await api.get('/looks', { timeout: 8000 });
         const looksArray = data.looks || (Array.isArray(data) ? data : []);
         setCommunityLooks(looksArray.slice(0, 12));
       } catch (err) {
         // Silently fail for non-critical content
         if (process.env.NODE_ENV === 'development') console.warn("Background looks fetch failed.");
       }
    };

    fetchCriticalData();
    fetchNonCriticalData();
  }, [user?._id]);

  // Infinite Scroll Implementation for Community Looks
  const displayLooks = useMemo(() => {
    if (communityLooks.length === 0) return [];
    return [...communityLooks, ...communityLooks, ...communityLooks]; // Triple for maximum smoothness
  }, [communityLooks]);
  
  useEffect(() => {
    if (communityLooksRef.current && communityLooks.length > 0) {
      const el = communityLooksRef.current;
      const singleSetWidth = el.scrollWidth / 3;
      el.scrollLeft = singleSetWidth;
    }
  }, [communityLooks.length]);

  useEffect(() => {
    const el = communityLooksRef.current;
    if (!el || communityLooks.length === 0) return;

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
  }, [communityLooks.length]);

  useEffect(() => {
    if (communityLooks.length <= 1) return;
    const timer = setInterval(() => {
        if (communityLooksRef.current) {
            communityLooksRef.current.scrollBy({ left: communityLooksRef.current.clientWidth * 0.8, behavior: 'smooth' });
        }
    }, 6000);
    return () => clearInterval(timer);
  }, [communityLooks.length]);

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setActiveView(filter);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveView('all');
    }
  }, [searchParams]);

  // --- CAROUSEL LOGIC ---
  const [resetKey, setResetKey] = useState(0);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (activeView !== 'all' || slides.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, activeView, slides.length, resetKey]);

  useEffect(() => {
    if (slides.length > 0) {
      slides.forEach((slide: any, index: number) => {
        const img = new (window as any).Image();
        img.src = slide.img;
        img.onload = () => {
          setLoadedImages(prev => ({ ...prev, [index]: true }));
        };
      });
    }
  }, [slides]);

  const handleManualNav = (dir: 'next' | 'prev') => {
    if (dir === 'next') nextSlide();
    else prevSlide();
    setResetKey(prev => prev + 1);
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null> | null, direction: 'left' | 'right') => {
    if (ref && ref.current) {
      const el = ref.current;
      const width = el.clientWidth;
      const scrollAmount = direction === 'left' ? -width * 0.8 : width * 0.8;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const productSections = useMemo(() => [
    { id: 'trending', title: 'Trending Now', subtitle: 'Most Wanted Artifacts', items: homeData.trending || [], link: '/shop?sort=mostViewed', ref: trendingRef, bg: 'bg-white' },
    { id: 'cloth', title: 'Curated Cloth', subtitle: 'Elite Studio Apparel', items: (homeData.trending || []).filter((p: any) => p.category === 'Fashion'), link: '/shop?category=Fashion', ref: fashionTrendingRef, bg: 'bg-white' },
    { id: 'accessories', title: 'Elite Accessories', subtitle: 'Refine Your Aesthetic', items: (homeData.bestSellers || []).filter((p: any) => p.category === 'Accessories'), link: '/shop?category=Accessories', ref: accessoriesPrimeRef, bg: 'bg-white' },
    { id: 'gadgets', title: 'Performance Gadgets', subtitle: 'High-Tech Essentials', items: (homeData.newArrivals || []).filter((p: any) => p.category === 'Electronics'), link: '/shop?category=Electronics', ref: techLatestRef, bg: 'bg-white' },
    { id: 'best-sellers', title: 'Best Sellers', subtitle: 'Curated Elite Artifacts', items: homeData.bestSellers || [], link: '/shop?best=true', ref: bestSellersSectionRef, bg: 'bg-white' },
    { id: 'new-arrivals', title: 'New Arrivals', subtitle: 'Fresh Drops Studio', items: homeData.newArrivals || [], link: '/shop?new=true', ref: newArrivalRef, bg: 'bg-white' },
    { id: 'all-artifacts', title: 'The Studio Collection', subtitle: 'Explore All Artifacts', items: allProducts, link: '/shop', ref: allProductsRef, bg: 'bg-white' },
    ...(homeData.dynamicSections || []).map((section: any) => ({
      id: section.id,
      title: section.title,
      subtitle: 'Curated Studio Series',
      items: section.items || [],
      link: `/shop?badge=${encodeURIComponent(section.title)}`,
      ref: React.createRef<HTMLDivElement>(),
      bg: 'bg-white'
    }))
  ], [homeData, allProducts]);

  const categories = [
    { id: 'cloth', name: 'Cloth', icon: Shirt, cat: 'Fashion' },
    { id: 'accessories', name: 'Accessories', icon: Watch, cat: 'Accessories' },
    { id: 'gadgets', name: 'Gadgets', icon: Smartphone, cat: 'Electronics' },
    { id: 'home', name: 'Studio', icon: HomeIcon, cat: 'Home' },
    { id: 'all', name: 'All', icon: ShoppingBag, cat: 'all' }
  ];

  return (
    <div className="bg-white min-h-screen selection:bg-black selection:text-white overflow-x-hidden font-sans">
      <FlashSaleBanner />

      {activeView === 'all' && (
        <>
          {slides.length === 0 ? (
            <section className="relative w-full h-[100vh] bg-zinc-950 flex flex-col items-center justify-center gap-6 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-transparent to-transparent animate-pulse" />
                </div>
                <div className="z-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-t-2 border-white animate-spin opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse">Initializing Studio Experience</p>
                </div>
            </section>
          ) : (
            <section className="relative w-full min-h-[100vh] h-[100vh] md:h-screen bg-black overflow-hidden group/hero">
              <div className="absolute inset-0 z-10">
                {slides.map((slide: any, idx: number) => (
                  <motion.div
                    key={slide.key}
                    initial={false}
                    animate={{ 
                      opacity: idx === currentSlide ? 1 : 0,
                      zIndex: idx === currentSlide ? 20 : 10 
                    }}
                    transition={{ 
                      opacity: { 
                        duration: 0.8, 
                        ease: "linear",
                        delay: idx === currentSlide ? 0 : 0.8 
                      } 
                    }}
                    className="absolute inset-0"
                  >
                    <div className="absolute inset-0 overflow-hidden bg-black">
                      <motion.div
                        style={{ 
                          scale: heroScale,
                          y: heroY
                        }}
                        className="w-full h-full relative"
                      >
                        <SafeImage
                          src={slide.img}
                          alt={slide.title}
                          fill
                          priority={idx === 0}
                          loading={idx === 0 ? undefined : "lazy"}
                          sizes="100vw"
                          className="object-cover pointer-events-none select-none"
                          draggable={false}
                        />
                      </motion.div>
                    </div>
                    
                    {idx === currentSlide && (
                      <div className="absolute inset-0 flex items-center justify-center px-6 z-30">
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="text-center"
                        >
                          <p className="text-white/80 text-[7px] md:text-base font-black uppercase tracking-mega mb-4">{slide.subtitle}</p>
                          <h1 className="text-white text-xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 leading-none">{slide.title}</h1>
                          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <button onClick={scrollToProducts} className="bg-white text-black px-10 py-4 text-[8px] md:text-[10px] font-black uppercase tracking-extrawide hover:bg-black hover:text-white transition-all duration-500 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.1)]">Explore SLOOK</button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 z-20"></div>
                  </motion.div>
                ))}
              </div>

              <div className="absolute inset-0 z-30 flex items-center justify-between px-4 md:px-10 pointer-events-none opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500">
                <button onClick={(e) => { e.stopPropagation(); handleManualNav('prev'); }} className="text-white/40 hover:text-white transition-all pointer-events-auto transform hover:scale-125 active:scale-90">
                  <ChevronLeft strokeWidth={1} size={64} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleManualNav('next'); }} className="text-white/40 hover:text-white transition-all pointer-events-auto transform hover:scale-125 active:scale-90">
                  <ChevronRight strokeWidth={1} size={64} />
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {productSections.map((section, idx) => (
        <React.Fragment key={section.id}>
          {(activeView === 'all' || activeView === section.id) && (
            <Reveal width="100%" delay={idx * 0.1}>
              <section id={section.id} className={`container-responsive relative ${section.bg} ${activeView !== 'all' ? 'pt-44 md:pt-52 pb-24 md:pb-32' : 'py-8 md:py-16'}`}>
                <div className="flex justify-between items-end mb-10 px-2">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">{section.title}</h2>
                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2">{section.subtitle}</p>
                  </div>
                  <Link href={section.link} className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 pb-1 hover:border-black hover:text-zinc-600 transition-all">View All</Link>
                </div>

                <div className="relative flex items-center group/scroller">
                  {section.items.length > 0 && activeView === 'all' && (
                    <>
                      <button onClick={() => scroll(section.ref, 'left')} className="absolute -left-2 md:-left-20 top-[30%] md:top-[40%] -translate-y-1/2 z-50 text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95"><ChevronLeft className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} /></button>
                      <button onClick={() => scroll(section.ref, 'right')} className="absolute -right-2 md:-right-20 top-[30%] md:top-[40%] -translate-y-1/2 z-50 text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95"><ChevronRight className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} /></button>
                    </>
                  )}
                  {error && idx === 0 && (
                    <div className="w-full py-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center gap-4">
                      <p className="font-bold uppercase tracking-widest text-xs">{error}</p>
                      <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Retry Connection</button>
                    </div>
                  )}
                  <div ref={section.ref} className={`${activeView === 'all' ? 'flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-0 pb-10 w-full' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8'}`}>
                    {section.items.length > 0 ? (
                      section.items.filter((p: any) => p && p._id).map((product: any) => (
                        <div key={product._id} className={`${activeView === 'all' ? 'w-[181.03px] md:w-auto md:min-w-[20%] lg:min-w-[16%] snap-start flex-shrink-0' : 'w-full'}`}><ProductCard product={product} /></div>
                      ))
                    ) : !loading && !error ? (
                      <div className="w-full py-12 text-center border-2 border-dashed border-zinc-100 rounded-3xl col-span-full">
                        <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">No Artifacts Curated Yet</p>
                      </div>
                    ) : (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[21%] flex-shrink-0 space-y-4">
                          <Skeleton className="aspect-square w-full rounded-2xl bg-zinc-100" />
                          <Skeleton className="h-4 w-3/4 rounded-full bg-zinc-100" />
                          <Skeleton className="h-3 w-1/4 rounded-full bg-zinc-50" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </Reveal>
          )}
        </React.Fragment>
      ))}

      {activeView === 'all' && (
        <Reveal width="100%">
          <FeaturedReviews />
        </Reveal>
      )}

      {activeView === 'all' && (
        <Reveal width="100%">
          <section className="container-responsive py-8 md:py-16 relative bg-white border-t border-zinc-100 group/community">
            <div className="flex justify-between items-end mb-16 px-4 md:px-0">
              <div>
                <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">STYLED BY <span className="text-zinc-200">YOU</span></h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">COMMUNITY CURATION #STYLEDBYSLOOK</p>
              </div>
              <Link href="/community" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 pb-1 hover:border-black hover:text-zinc-600 transition-all">View All Looks</Link>
            </div>

            <div className="relative group/community-nav">
              <button onClick={() => scroll(communityLooksRef, 'left')} className="absolute -left-2 md:-left-20 top-1/2 -translate-y-1/2 z-[60] text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95 bg-white/10 rounded-full">
                <ChevronLeft className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
              </button>
              <button onClick={() => scroll(communityLooksRef, 'right')} className="absolute -right-2 md:-right-20 top-1/2 -translate-y-1/2 z-[60] text-black hover:text-zinc-600 transition-all hover:scale-110 active:scale-95 bg-white/10 rounded-full">
                <ChevronRight className="w-8 h-8 md:w-16 md:h-16" strokeWidth={1} />
              </button>

              <div ref={communityLooksRef} className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar py-8 snap-x snap-mandatory scroll-smooth px-4 md:px-0">
                {displayLooks.length === 0 ? (
                   [...Array(4)].map((_, i) => (
                    <div key={i} className="w-[300px] md:w-[350px] aspect-[4/5] bg-zinc-100 animate-pulse rounded-[2.5rem] shrink-0" />
                   ))
                ) : displayLooks.map((look: any, idx: number) => {
                  const u = look.user || {};
                  const displayHandle = (u ? `${u.firstName} ${u.lastName}`.trim() : look.userName) || "House Stylist";
                  const formattedHandle = displayHandle.toLowerCase().replace(/\s+/g, '');
                  
                    return (
                      <Link key={`${look._id}-${idx}`} href="/community" className="relative w-[300px] md:w-[350px] bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-xl shrink-0 snap-center group/card transition-all duration-500 hover:-translate-y-2">
                        <div className="aspect-[4/5] overflow-hidden bg-zinc-100 relative">
                          <SafeImage src={resolveMediaURL(look.image) || "/placeholder.jpg"} fill alt="" sizes="(max-width: 768px) 300px, 350px" className="object-cover group-hover/card:scale-105 transition-all duration-1000" />
                        </div>
                        <div className="p-8">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-100 flex items-center justify-center overflow-hidden">
                              {u?.avatar ? (
                                <img src={resolveMediaURL(u.avatar) || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-[12px] text-white font-black">{(displayHandle[0] || "S").toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[12px] font-black uppercase tracking-tight text-zinc-900 leading-none">@{formattedHandle}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Sparkles size={10} className="text-amber-500 fill-amber-500" />
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Elite Stylist</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-[12px] font-black text-zinc-900 uppercase tracking-tight line-clamp-1 leading-relaxed">
                            &quot;{look.caption}&quot;
                          </p>
                        </div>
                      </Link>
                    );
                })}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {activeView === 'all' && (
        <Reveal width="100%">
          <section className="container-responsive py-12 md:py-24 bg-zinc-950 text-white overflow-hidden relative rounded-[3rem] mb-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 relative z-10 px-8">
              <div className="space-y-4">
                <p className="text-amber-500 text-[8px] md:text-[10px] font-black uppercase tracking-mega">Elite Rewards</p>
                <h2 className="text-base md:text-7xl font-black uppercase tracking-tighter leading-none">Loyalty <br /> <span className="text-zinc-800">Milestones.</span></h2>
              </div>
              <div className="max-w-xs">
                <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">Earn coins on every artifact purchase. Unlock exclusive tiers and baseline rewards.</p>
                <Link href="/account/loyalty" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-4 rounded-full hover:bg-zinc-200 transition-all">View My Ledger</Link>
              </div>
            </div>

            <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-10 px-8 snap-x relative z-10">
              {[
                { tier: 'Bronze', spend: '0', color: 'from-orange-700 to-orange-900', perk: 'Base Tier' },
                { tier: 'Silver', spend: '5,000', color: 'from-zinc-300 to-zinc-500', perk: '1.2x Coins' },
                { tier: 'Gold', spend: '20,000', color: 'from-amber-400 to-amber-600', perk: '1.5x Coins' },
                { tier: 'Platinum', spend: '50,000', color: 'from-zinc-100 to-zinc-400', perk: '2x Coins' }
              ].map((m, i) => (
                <div key={i} className="min-w-[280px] bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] snap-center group hover:border-amber-500/30 transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} mb-8 shadow-lg group-hover:scale-110 transition-transform`}></div>
                  <h3 className="text-sm md:text-2xl font-black uppercase tracking-tight mb-2">Elite {m.tier}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Unlocked at ₹{m.spend}</p>
                  <p className="text-xs font-black uppercase text-amber-500">{m.perk}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}
      
      <AIStylist />
    </div>
  );
};


