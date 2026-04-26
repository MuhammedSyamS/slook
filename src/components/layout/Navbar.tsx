'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Heart, Bell, User, ShoppingBag, Menu, X,
  ChevronLeft, ChevronRight, Shield,
  BadgePercent, Info, Zap, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import Image from 'next/image';

// SLOOK Specific Stores
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from '@/components/shared/Price';
import { useToast } from '@/context/ToastContext';

const Badge = ({ count, textColor = "text-white", showNumber = true }: { count: number, textColor?: string, showNumber?: boolean }) => (
  <AnimatePresence mode="popLayout">
    {count > 0 && (
      <motion.div
        key="badge-container"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={`absolute -top-1.5 -right-1 ${textColor} text-[11px] font-black pointer-events-none z-10 flex items-center justify-center`}
        style={{
          textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        <div className={`relative flex items-center justify-center ${showNumber ? 'min-w-[14px] h-[14px] px-1' : 'w-2 h-2'} bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)]`}>
          {showNumber && (
            <AnimatePresence mode="wait">
              <motion.span
                key={count}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-[8px] text-black font-black leading-none"
              >
                {count > 9 ? '9+' : count}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // STORES
  const { user, wishlist, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const toggleSearch = useUIStore((state) => state.toggleSearch);
  const toggleDesktopSidebar = useUIStore((state) => state.toggleDesktopSidebar);
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar);

  // LOGIC
  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const wishlistCount = user ? (user.wishlist?.length || 0) : (wishlist?.length || 0);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // SEARCH SUGGESTIONS
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [searchValue, setSearchValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchValue(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search?keyword=${val}`);
        setSuggestions(data || { products: [], categories: [] });
      } catch (error) {
        console.error("Search Error:", error);
        setSuggestions({ products: [], categories: [] });
      }
    }, 300); // 300ms debounce
  };

  // Keyboard Shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, toggleSearch]);

  const isAdminRoute = pathname?.startsWith('/admin');

  // --- TOP BANNER LOGIC ---
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchTopBanners = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data && data.topNavbarMessages) {
            setMessages(data.topNavbarMessages);
        }
      } catch (err) {
         console.error("Failed to fetch top banners", err);
      }
    };
    fetchTopBanners();

    // Listen for live updates
    window.addEventListener('settings-updated', fetchTopBanners);
    return () => window.removeEventListener('settings-updated', fetchTopBanners);
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => { handleNext(); }, 4000);
    return () => clearInterval(timer);
  }, [currentMsgIndex, messages.length]);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FETCH NOTIFICATIONS (Refactored for Performance)
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      // Use client with 15s internal timeout specifically for background tasks
      const { data } = await api.get('/users/notifications', { 
        params: { t: Date.now() },
        timeout: 15000 
      });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Only log errors in development, avoid spamming console for timeouts
      if (process.env.NODE_ENV === 'development' && !err.message?.includes('timeout')) {
        console.warn("[Navbar] Notification fetch failed (non-critical):", err.message);
      }
      // If we get a 401, the interceptor will handle it, otherwise just fail silently
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
        setNotifications([]);
        return;
    }

    // Delay initial fetch to let page render first
    const timer = setTimeout(fetchNotifications, 2000);

    // --- SOCKET.IO ---
    let socket: any;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
      : 'http://localhost:5005';

    try {
      socket = io(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
        reconnectionAttempts: 3
      });

      socket.on('connect', () => {
        socket.emit('join-user-room', user._id);
      });

      socket.on('notification', (notif: any) => {
        setNotifications(prev => [notif, ...(Array.isArray(prev) ? prev : [])]);
      });

      socket.on('connect_error', () => {
        // Silently fail, don't spam console
      });
    } catch (e) {
      console.error("Socket Init Error:", e);
    }

    const interval = setInterval(fetchNotifications, 60000 * 5); // Every 5 minutes instead of 1
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [user?._id, fetchNotifications]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await api.put(`/users/notifications/${notif._id}/read`, {});
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) { }
    }

    const data = notif.data || {};
    let targetUrl = data.url || data.link;

    if (targetUrl) {
      router.push(targetUrl);
      setShowNotif(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotif && !(event.target as Element).closest('.group')) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotif]);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % messages.length);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentMsgIndex((prev) => (prev - 1 + messages.length) % messages.length);
      setIsAnimating(false);
    }, 300);
  };

  const handleFilterNavigation = (viewType: string) => {
    router.push(`/?filter=${viewType}`);
    setIsMenuOpen(false);
  };

  // We now show the navbar on admin routes but with a toggle for the sidebar
  // if (isAdminRoute) return null; 

  return (
    <div className={`fixed top-0 z-[100] transition-all duration-300 ease-in-out left-0 w-full`}>

      {/* --- TOP BANNER --- */}
      {messages.length > 0 && (
      <div className="bg-black text-white h-10 flex items-center justify-center px-4">
        {messages.length > 1 && (
        <button onClick={handlePrev} className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer flex-shrink-0">
          <ChevronLeft size={14} />
        </button>
        )}
        <div className="h-full w-full max-w-[280px] md:max-w-[400px] relative overflow-hidden mx-2">
          <div className={`w-full h-full flex items-center justify-center transition-all duration-300 transform ${isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            {messages[currentMsgIndex]?.link ? (
              <Link href={messages[currentMsgIndex].link} className="font-black tracking-mega uppercase text-[8px] md:text-[9px] text-center hover:text-zinc-300 transition-colors">
                {messages[currentMsgIndex].text}
              </Link>
            ) : (
              <p className="font-black tracking-mega uppercase text-[8px] md:text-[9px] text-center">
                {messages[currentMsgIndex]?.text}
              </p>
            )}
          </div>
        </div>
        {messages.length > 1 && (
        <button onClick={handleNext} className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer flex-shrink-0">
          <ChevronRight size={14} />
        </button>
        )}
      </div>
      )}

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[max(env(safe-area-inset-top),0px)] md:absolute md:top-full md:left-0 md:right-0 md:bottom-auto bg-white text-black md:rounded-b-2xl flex flex-col z-[200] shadow-2xl overflow-hidden max-h-screen md:max-h-[80vh]"
          >
            {/* SEARCH INPUT AREA */}
            <div className="flex items-center px-5 md:px-8 h-16 md:h-20 w-full relative border-b border-zinc-100 md:border-none shrink-0 bg-white">
              <Search className="text-black w-5 h-5 flex-shrink-0" />
              <input
                autoFocus
                ref={searchInputRef}
                type="text"
                placeholder="SEARCH SLOOK..."
                className="flex-1 bg-transparent outline-none px-4 text-xs md:text-sm font-black uppercase tracking-widest h-full placeholder:text-zinc-300"
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    toggleSearch();
                    router.push(`/shop?keyword=${(e.target as HTMLInputElement).value}`);
                  }
                }}
              />
              <button
                onClick={toggleSearch}
                className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors px-2 md:hidden"
              >
                Cancel
              </button>
              <button onClick={toggleSearch} className="hidden md:block">
                <X className="w-5 h-5 text-black flex-shrink-0 hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* SUGGESTIONS AREA */}
            {searchValue && (
              <div className="flex-1 md:max-h-[60vh] overflow-y-auto no-scrollbar bg-[#fcfcfc] pb-20 md:pb-0">
                {(suggestions.products?.length > 0 || suggestions.categories?.length > 0) ? (
                  <>
                    {/* CATEGORIES GROUP */}
                    {suggestions.categories?.length > 0 && (
                      <div className="p-6 md:p-8 border-b border-zinc-100 bg-white/50">
                        <p className="text-[10px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6">Categories</p>
                        <div className="flex flex-wrap gap-2.5">
                          {suggestions.categories.map((cat: string, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                toggleSearch();
                                router.push(`/shop?category=${cat}`);
                              }}
                              className="px-3 py-2 bg-white border border-zinc-200 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PRODUCTS GROUP */}
                    {suggestions.products?.length > 0 && (
                      <div className="p-6 md:p-8">
                        <p className="text-[10px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6">Products</p>
                        <div className="grid grid-cols-1 gap-3">
                          {suggestions.products.map((p: any) => {
                            const imgPath = p.image || p.images?.[0] || '';
                            const imgSrc = resolveMediaURL(imgPath);
                            return (
                            <div
                              key={p._id}
                              onClick={() => {
                                toggleSearch();
                                router.push(`/product/${p.slug || p._id}`);
                              }}
                              className="flex items-center gap-3 md:gap-5 p-2 md:p-4 bg-white hover:shadow-xl rounded-[1.5rem] cursor-pointer transition-all border border-zinc-100 hover:border-black/5 group"
                            >
                              <div className="w-12 h-16 md:w-14 md:h-16 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-100 group-hover:scale-95 transition-transform relative">
                                <Image 
                                  src={imgSrc || "/placeholder.jpg"} 
                                  alt={p.name} 
                                  fill
                                  className="object-cover" 
                                  sizes="56px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] md:text-xs font-black uppercase tracking-tight text-black flex items-center gap-2 truncate">
                                  {p.name}
                                  <Zap size={10} className="text-zinc-200 group-hover:text-amber-400 transition-colors shrink-0" />
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <Price amount={p.price} className="text-[10px] md:text-xs text-zinc-900 font-extrabold" />
                                  <span className="text-[8px] md:text-[9px] font-black uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-400 tracking-wider">
                                    {String(Array.isArray(p.category) ? p.category[0] : (p.category || 'Product')).substring(0, 15)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-zinc-200 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                          )})}
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => toggleSearch()}
                      className="p-8 text-center text-[10px] md:text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 hover:text-black cursor-pointer border-t border-zinc-50 bg-white transition-colors"
                    >
                      View all results
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-40">
                    <Search size={40} strokeWidth={1} className="mb-4 text-black opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No results found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN NAV */}
      <nav className={`transition-all duration-700 relative border-b border-white/10 ${isScrolled || isMenuOpen || isAdminRoute ? 'bg-black/95 shadow-xl' : 'bg-black/40'}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center h-16 md:h-20">

          {/* LEFT SECTION */}
          <div className="flex-1 flex items-center gap-2 md:gap-4">
            {isAdminRoute && (
              <button 
                onClick={() => {
                  if (window.innerWidth >= 768) toggleDesktopSidebar();
                  else toggleMobileSidebar();
                }} 
                className="p-2 text-white hover:bg-white/10 rounded-full transition cursor-pointer active:scale-95"
                title="Toggle Sidebar"
              >
                <Menu size={24} />
              </button>
            )}

            {!isAdminRoute && (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white mr-0">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}

            <Link href="/" onClick={() => handleFilterNavigation('all')} className="flex items-center group">
              <span className="text-xl md:text-3xl font-black tracking-tighter uppercase text-white transform scale-y-110">SLOOK</span>
              {isMounted && (user?.role === 'admin' || user?.isAdmin) ? (
                <span className="text-red-500 drop-shadow-md text-xs md:text-sm ml-2 font-black">ADMIN</span>
              ) : isMounted && user?.role === 'manager' ? (
                <span className="text-blue-400 drop-shadow-md text-xs md:text-sm ml-2 font-black">MANAGER</span>
              ) : null}
            </Link>
          </div>

          {/* CENTER SECTION */}
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black tracking-[0.4em] uppercase">
            <Link href="/looks" className="text-white hover:text-zinc-400 transition group relative">
              COMMUNITY
              <span className="absolute -top-1 -right-4 bg-red-600 text-[6px] px-1 rounded animate-pulse text-white tracking-normal font-black">LIVE</span>
            </Link>
            <Link href="/reviews" className="text-white hover:text-zinc-400 transition whitespace-nowrap">
              ALL REVIEWS
            </Link>
            <button 
              onClick={() => router.push('/support')} 
              className="text-white hover:text-zinc-400 transition whitespace-nowrap"
              suppressHydrationWarning
            >NEED HELP</button>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex-1 flex items-center justify-end gap-3 md:gap-6 text-base md:text-[10px] font-black tracking-[0.4em] uppercase transition-all">
            <button 
              onClick={() => toggleSearch()} 
              className="relative group p-2 md:p-3 transition-all"
              suppressHydrationWarning
            >
              <Search className="w-5 h-5 md:w-5 md:h-5 text-white group-hover:text-zinc-200 transition" />
            </button>

            {/* WISHLIST */}
            <Link href="/wishlist" className="relative group p-2 md:p-3 transition-all">
              <Heart className={`w-5 h-5 md:w-5 md:h-5 transition ${(isMounted && wishlistCount > 0) ? 'text-white fill-white' : 'text-white'}`} />
            </Link>

            {/* CART */}
            <button 
              onClick={() => toggleCart()} 
              className="relative group p-2 md:p-3 transition-all"
              suppressHydrationWarning
            >
              <ShoppingBag className="w-5 h-5 md:w-5 md:h-5 text-white group-hover:text-zinc-200 transition" />
              {isMounted && <Badge count={cartCount} />}
            </button>

            {/* NOTIFICATIONS - DESKTOP ONLY */}
            <div className="hidden md:block relative group">
              <button
                onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  setShowNotif(!showNotif);
                }}
                className="relative outline-none flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <Bell className={`w-4 h-4 md:w-5 md:h-5 transition ${showNotif ? 'text-zinc-400' : 'text-white'}`} />
                <Badge count={unreadCount} />
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 z-50 origin-top-right"
                  >
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl w-[90vw] max-w-[20rem] border border-white/20 overflow-hidden ring-1 ring-black/5">
                       <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-white/50">
                        <h3 className="text-[12px] font-bold text-zinc-500">Notifications</h3>
                        <button onClick={() => setShowNotif(false)} className="hover:bg-zinc-100 p-1 rounded-full transition"><X size={14} /></button>
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar bg-white/30">
                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center gap-2">
                            <Bell size={24} className="text-zinc-200" />
                            <p className="text-sm md:text-[12px] font-medium text-zinc-400">No new alerts</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-4 border-b border-zinc-50 hover:bg-white/80 transition cursor-pointer relative group/item ${n.isRead ? 'opacity-60 bg-transparent' : 'bg-white/60'}`}
                            >
                              {!n.isRead && <div className="absolute right-4 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                              <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'promo' ? 'bg-amber-100 text-amber-600' : (n.type === 'order' ? 'bg-zinc-100 text-black' : 'bg-blue-50 text-blue-600')}`}>
                                  {n.type === 'order' ? <ShoppingBag size={14} /> : (n.title?.includes('Price Drop') ? <BadgePercent size={14} /> : (n.type === 'promo' ? <Heart size={14} /> : <Info size={14} />))}
                                </div>
                                <div className="flex-1">
                                  <p className="text-[11px] font-bold text-black mb-1">{n.title}</p>
                                  <p className="text-[9px] text-zinc-600 leading-relaxed">{n.message}</p>
                                  <p className="text-[8px] md:text-[9px] text-zinc-300 mt-2 font-mono">{new Date(n.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-zinc-100 bg-white/50 text-center">
                         <Link href="/account/notifications" className="text-[10px] md:text-[11px] font-bold text-zinc-400 hover:text-black transition-colors">View All Notifications</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PROFILE - DESKTOP ONLY */}
            <Link href={user ? "/account" : "/login"} className="hidden md:flex p-1 rounded-full hover:bg-white/10 transition-all text-white border border-transparent hover:border-white/20">
              {user?.avatar ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20">
                    <img 
                    src={resolveMediaURL(user.avatar) || "/placeholder.jpg"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                  />
                </div>
              ) : (
                <User className="w-5 h-5" fill={user ? "currentColor" : "none"} />
              )}
            </Link>

            {/* ADMIN SHORTCUT */}
            {(user?.role === 'admin' || user?.isAdmin) && (
              <Link href="/admin" className="hidden md:flex p-2 rounded-full hover:bg-white/10 transition-all text-red-500" title="Admin Dashboard">
                <Shield className="w-5 h-5 fill-red-500/10" />
              </Link>
            )}

          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl px-8 pb-12 border-t border-white/10"
            >
              <div className="pt-10 grid grid-cols-2 gap-x-8 gap-y-8">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <Link href="/looks" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest">Community</Link>
                    <span className="bg-red-600 text-[6px] px-1 rounded animate-pulse text-white tracking-normal font-black">LIVE</span>
                  </div>
                  <Link href="/reviews" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest">All Reviews</Link>
                </div>
                <div className="flex flex-col gap-6">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2">Support</p>
                  <Link href="/support" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest">Need Help</Link>
                  <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest text-orange-400">Contact Us</Link>
                  <Link href="/track-order" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest">Track Order</Link>
                </div>
              </div>

              <div className="border-t border-white/10 mt-10 pt-8 flex items-center justify-between">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <Link href="/account" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group">
                      {user.avatar ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 group-hover:scale-110 transition-transform">
                          <img src={resolveMediaURL(user.avatar) || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                        </div>
                      ) : (
                        <User size={14} className="fill-white" />
                      )}
                      My Account
                    </Link>
                    <button onClick={() => { logout(); router.push('/login'); setIsMenuOpen(false); }} className="text-red-500 text-[11px] font-black uppercase tracking-widest text-left">Log Out</button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                     <User size={14} /> Sign In
                  </Link>
                )}

                <div className="flex items-center gap-4">
                  {((user as any)?.role === 'admin' || (user as any)?.isAdmin) && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-red-500 p-2 bg-red-500/10 rounded-full" title="Admin Dashboard">
                      <Shield size={14} fill="currentColor" fillOpacity={0.1} />
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (!user) { router.push('/login'); return; }
                      router.push('/account/notifications');
                    }}
                    className="text-white p-3 bg-white/5 rounded-full relative"
                  >
                    <Bell size={18} />
                    <Badge count={unreadCount} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
