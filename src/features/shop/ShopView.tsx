'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { client as api } from '@/lib/api/client';
import ProductCard from '@/components/shared/ProductCard';
import { Search, SlidersHorizontal, ChevronDown, X, RotateCcw, Zap, Star, Percent } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { Skeleton } from '@/components/ui/Skeleton';
import Reveal from '@/components/shared/Reveal';
import { IProduct } from '@/types/product';

const colorMap: Record<string, string> = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Red': '#EF4444',
    'Blue': '#3B82F6',
    'Green': '#22C55E',
    'Grey': '#71717A',
    'Slate': '#475569',
    'Navy': '#1E3A8A',
    'Pink': '#EC4899',
    'Beige': '#F5F5DC',
    'Cream': '#FFFDD0',
    'Olive': '#808000',
    'Tan': '#D2B48C',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
};

interface ActiveFiltersProps {
    category: string;
    setCategory: (val: string) => void;
    subcategory: string;
    setSubcategory: (val: string) => void;
    filters: any;
    setFilters: (val: any) => void;
    flags: any;
    setFlags: (val: any) => void;
    priceRange: any;
    setPriceRange: (val: any) => void;
    activeSpecs: Record<string, string[]>;
    toggleSpec: (key: string, val: string) => void;
    resetFilters: () => void;
}

const ActiveFilters = ({ 
    category, setCategory,
    subcategory, setSubcategory,
    filters, setFilters,
    flags, setFlags,
    priceRange, setPriceRange,
    activeSpecs, toggleSpec,
    resetFilters
}: ActiveFiltersProps) => {
    const activeFilters: { label: string; type: string; key?: string; val?: string }[] = [];
    if (category !== 'All') activeFilters.push({ label: category, type: 'category' });
    if (subcategory !== 'All') activeFilters.push({ label: `Sub: ${subcategory}`, type: 'subcategory' });
    if (filters.color) activeFilters.push({ label: filters.color, type: 'color' });
    if (filters.size) activeFilters.push({ label: filters.size, type: 'size' });
    if (filters.minRating > 0) activeFilters.push({ label: `${filters.minRating}+ Stars`, type: 'rating' });
    if (filters.minDiscount > 0) activeFilters.push({ label: `${filters.minDiscount}%+ OFF`, type: 'discount' });
    if (flags.isFlashSale) activeFilters.push({ label: 'Flash Sale', type: 'flashSale' });
    if (priceRange.min || priceRange.max) activeFilters.push({ label: `₹${priceRange.min || 0} - ₹${priceRange.max || '∞'}`, type: 'price' });
    
    Object.entries(activeSpecs).forEach(([key, values]: [string, string[]]) => {
        values.forEach((val: string) => activeFilters.push({ label: `${key}: ${val}`, type: 'spec', key, val }));
    });

    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in duration-500">
            {activeFilters.map((f: any, i: number) => (
                <button
                    key={i}
                    onClick={() => {
                        if (f.type === 'category') setCategory('All');
                        else if (f.type === 'subcategory') setSubcategory('All');
                        else if (f.type === 'color') setFilters({ ...filters, color: '' });
                        else if (f.type === 'size') setFilters({ ...filters, size: '' });
                        else if (f.type === 'rating') setFilters({ ...filters, minRating: 0 });
                        else if (f.type === 'discount') setFilters({ ...filters, minDiscount: 0 });
                        else if (f.type === 'flashSale') setFlags({ ...flags, isFlashSale: false });
                        else if (f.type === 'price') setPriceRange({ min: '', max: '' });
                        else if (f.type === 'spec' && f.key && f.val) toggleSpec(f.key, f.val);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white hover:border-black transition-all group shadow-sm"
                >
                    {f.label}
                    <X size={8} className="text-zinc-400 group-hover:text-white" />
                </button>
            ))}
            <button
                onClick={resetFilters}
                className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors ml-2"
            >
                Clear All
            </button>
        </div>
    );
};

export const ShopView: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'All');
    const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || 'All');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [priceRange, setPriceRange] = useState({ 
        min: searchParams.get('minPrice') || '', 
        max: searchParams.get('maxPrice') || '' 
    });
    const [filters, setFilters] = useState({ 
        size: searchParams.get('size') || '', 
        color: searchParams.get('color') || '', 
        minRating: Number(searchParams.get('minRating')) || 0, 
        minDiscount: Number(searchParams.get('minDiscount')) || 0 
    });
    const [flags, setFlags] = useState({ 
        inStock: searchParams.get('inStock') === 'true', 
        isNewArrival: searchParams.get('isNewArrival') === 'true' || searchParams.get('new') === 'true', 
        isBestSeller: searchParams.get('isBestSeller') === 'true' || searchParams.get('best') === 'true', 
        isFlashSale: searchParams.get('isFlashSale') === 'true' 
    });
    const [activeSpecs, setActiveSpecs] = useState<Record<string, string[]>>({});
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    // UI States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availableColors, setAvailableColors] = useState<string[]>([]);
    const [allAvailableSpecs, setAllAvailableSpecs] = useState<Record<string, string[]>>({});
    const [activeFilterKey, setActiveFilterKey] = useState('category');

    // Sync from URL only on initial mount or back/forward navigation
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const { data } = await api.get('/products/filters');
                setCategories(['All', ...data.categories.filter((c: string) => c !== 'All')]);
                setSubcategories(data.subcategories || []);
                setAvailableSizes(data.sizes || []);
                setAvailableColors(data.colors || []);
                setAllAvailableSpecs(data.specs || {});
            } catch (err) {
                console.error("Filter Data Fetch Fail", err);
            }
        };
        fetchFilterData();
    }, []);

    // 1. Debounced Keyword Search -> URL
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            const currentKeyword = params.get('keyword') || '';
            if (keyword !== currentKeyword) {
                if (keyword) params.set('keyword', keyword);
                else params.delete('keyword');
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, pathname, router, searchParams]);

    // 2. Fetch Products based on URL (Single Source of Truth)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const currentPage = Number(searchParams.get('page')) || 1;
                
                if (currentPage === 1) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const { data } = await api.get(`/products?${searchParams.toString()}`);
                
                if (currentPage === 1) {
                    setProducts(data.products || []);
                } else {
                    setProducts(prev => [...prev, ...(data.products || [])]);
                }
                
                setTotalPages(data.pages || 1);
                setPage(currentPage);
            } catch (err) {
                console.error("Shop Fetch Error:", err);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    // 3. Sync URL -> Local State (Handles Browser Navigation & Direct Entry)
    useEffect(() => {
        // Sync Keyword sparingly (only if meaningful difference)
        const kw = searchParams.get('keyword') || '';
        if (kw !== keyword) setKeyword(kw);

        // Sync Categories
        const cat = searchParams.get('category') || 'All';
        if (cat !== category) setCategory(cat);

        const sub = searchParams.get('subcategory') || 'All';
        if (sub !== subcategory) setSubcategory(sub);

        // Sync Sort
        const sr = searchParams.get('sort') || 'newest';
        if (sr !== sort) setSort(sr);

        // Sync Price
        const min = searchParams.get('minPrice') || '';
        const max = searchParams.get('maxPrice') || '';
        if (min !== priceRange.min || max !== priceRange.max) setPriceRange({ min, max });

        // Sync Other Filters
        const sz = searchParams.get('size') || '';
        const cl = searchParams.get('color') || '';
        const rt = Number(searchParams.get('minRating')) || 0;
        const ds = Number(searchParams.get('minDiscount')) || 0;
        if (sz !== filters.size || cl !== filters.color || rt !== filters.minRating || ds !== filters.minDiscount) {
            setFilters({ size: sz, color: cl, minRating: rt, minDiscount: ds });
        }

        // Sync Flags
        const stk = searchParams.get('inStock') === 'true';
        const nw = searchParams.get('isNewArrival') === 'true' || searchParams.get('new') === 'true';
        const bst = searchParams.get('isBestSeller') === 'true' || searchParams.get('best') === 'true';
        const fls = searchParams.get('isFlashSale') === 'true';
        if (stk !== flags.inStock || nw !== flags.isNewArrival || bst !== flags.isBestSeller || fls !== flags.isFlashSale) {
            setFlags({ inStock: stk, isNewArrival: nw, isBestSeller: bst, isFlashSale: fls });
        }

        // Sync Specs (Crucial fix for the loop!)
        const specs: Record<string, string[]> = {};
        searchParams.forEach((val, key) => {
            if (key.startsWith('spec_')) {
                const specKey = key.replace('spec_', '');
                if (!specs[specKey]) specs[specKey] = [];
                specs[specKey].push(val);
            }
        });
        
        // Use JSON stringify for simple deep comparison
        if (JSON.stringify(specs) !== JSON.stringify(activeSpecs)) {
            setActiveSpecs(specs);
        }
    }, [searchParams]);

    // Helper to update URL directly from interactions (Except Keyword)
    const updateQuery = useCallback((updates: Record<string, string | string[] | boolean | number | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === false || (key === 'category' && value === 'All') || (key === 'subcategory' && value === 'All')) {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.delete(key); // Clear existing values for this key
                value.forEach(v => params.append(key, v));
            } else {
                params.set(key, value.toString());
            }
        });

        // Reset to page 1 if any filter (other than page itself) changes
        if (!updates.page) {
            params.delete('page');
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const resetFilters = () => {
        setPriceRange({ min: '', max: '' });
        setFilters({ color: '', size: '', minRating: 0, minDiscount: 0 });
        setFlags({ inStock: false, isNewArrival: false, isBestSeller: false, isFlashSale: false });
        setCategory('All');
        setSubcategory('All');
        setKeyword('');
        setActiveSpecs({});
        router.push(pathname);
    };

    const toggleSpec = (key: string, value: string) => {
        const current = activeSpecs[key] || [];
        const next = current.includes(value) 
            ? current.filter(v => v !== value)
            : [...current, value];
        
        updateQuery({ [`spec_${key}`]: next.length > 0 ? next : null });
    };

    const getSelectedValuePreview = (groupId: string) => {
        if (groupId === 'category') return category === 'All' ? '' : category;
        if (groupId === 'subcategory') return subcategory === 'All' ? '' : subcategory;
        if (groupId === 'color') return filters.color;
        if (groupId === 'size') return filters.size;
        if (groupId === 'rating') return filters.minRating ? `${filters.minRating}+ Stars` : '';
        if (groupId === 'offers') return filters.minDiscount ? `${filters.minDiscount}%+ Off` : '';
        if (groupId === 'price') return (priceRange.min || priceRange.max) ? `₹${priceRange.min || 0}-₹${priceRange.max || '∞'}` : '';
        if (groupId === 'availability') {
            const active = Object.entries(flags).filter(([_, v]) => v).map(([k]) => k.replace('is', '').toLowerCase());
            return active.length > 0 ? active.join(', ') : '';
        }
        if (groupId.startsWith('spec_')) {
            const specKey = groupId.replace('spec_', '');
            return activeSpecs[specKey]?.join(', ') || '';
        }
        return '';
    };

    const filterGroups = useMemo(() => [
        { id: 'category', label: 'Category' },
        { id: 'subcategory', label: 'Subcategory', hidden: category === 'All' || subcategories.length === 0 },
        { id: 'color', label: 'Colors', hidden: availableColors.length === 0 },
        { id: 'size', label: 'Dimensions', hidden: availableSizes.length === 0 },
        { id: 'rating', label: 'Ratings' },
        { id: 'offers', label: 'Special Offers' },
        { id: 'price', label: 'Value (₹)' },
        { id: 'availability', label: 'Availability' },
        ...Object.keys(allAvailableSpecs).map(key => ({ id: `spec_${key}`, label: key }))
    ].filter(g => !g.hidden), [category, subcategories, availableColors, availableSizes, allAvailableSpecs]);

    const renderValues = () => {
        if (activeFilterKey === 'category') {
            return (
                <div className="grid grid-cols-1 gap-2">
                    {categories.filter(c => c !== 'All').map(cat => (
                        <button
                            key={cat}
                            onClick={() => updateQuery({ category: cat, subcategory: 'All' })}
                            className={`px-5 py-5 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all ${category === cat
                                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 text-black hover:bg-zinc-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey === 'subcategory') {
            const uniqueSubs = Array.from(new Set(subcategories.filter(s => s !== 'All')));
            return (
                <div className="grid grid-cols-1 gap-2">
                    {uniqueSubs.map(sub => (
                        <button
                            key={sub}
                            onClick={() => updateQuery({ subcategory: sub })}
                            className={`px-5 py-5 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all ${subcategory === sub
                                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 text-black hover:bg-zinc-100'}`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey === 'color') {
            return (
                <div className="grid grid-cols-1 gap-2">
                    {availableColors.map(c => {
                        const isSelected = filters.color === c;
                        return (
                            <button
                                key={c}
                                onClick={() => updateQuery({ color: isSelected ? null : c })}
                                className={`flex items-center justify-between px-5 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isSelected
                                    ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                                    : 'bg-zinc-50 text-black hover:bg-zinc-100'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: colorMap[c] || '#f4f4f5' }} />
                                    {c}
                                </div>
                                {isSelected && <Zap size={12} fill="white" />}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (activeFilterKey === 'size') {
            return (
                <div className="grid grid-cols-2 gap-2">
                    {availableSizes.map(s => (
                        <button
                            key={s}
                            onClick={() => updateQuery({ size: filters.size === s ? null : s })}
                            className={`py-8 rounded-2xl border text-[12px] font-black transition-all flex items-center justify-center ${filters.size === s
                                ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-white border-zinc-100 text-black hover:border-black'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey === 'rating') {
            return (
                <div className="space-y-3">
                    {[4, 3, 2].map(star => (
                        <button
                            key={star}
                            onClick={() => updateQuery({ minRating: filters.minRating === star ? 0 : star })}
                            className={`flex items-center justify-between w-full px-6 py-6 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${filters.minRating === star
                                ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 border-transparent text-black hover:border-zinc-100 hover:bg-white'}`}
                        >
                            <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < star ? (filters.minRating === star ? 'white' : 'black') : 'transparent'} strokeWidth={2} />
                                ))}
                                <span className="ml-4">& Up</span>
                            </div>
                            {filters.minRating === star && <Zap size={12} fill="white" />}
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey === 'offers') {
            return (
                <div className="space-y-3">
                    {[10, 20, 50].map(pct => (
                        <button
                            key={pct}
                            onClick={() => updateQuery({ minDiscount: filters.minDiscount === pct ? 0 : pct })}
                            className={`flex items-center justify-between w-full px-6 py-6 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${filters.minDiscount === pct
                                ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 border-transparent text-black hover:border-zinc-100 hover:bg-white'}`}
                        >
                            <span>{pct}% OFF or More</span>
                            <Percent size={12} />
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey === 'price') {
            return (
                <div className="space-y-8 pt-6 px-2">
                    <div className="flex flex-col gap-5">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Min Budget</label>
                        <input
                            type="number"
                            placeholder="₹ 0"
                            value={priceRange.min}
                            onChange={(e) => updateQuery({ minPrice: e.target.value })}
                            className="w-full bg-zinc-50 border-none p-6 rounded-[2rem] text-[14px] font-black text-black outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex flex-col gap-5">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Max Budget</label>
                        <input
                            type="number"
                            placeholder="₹ ∞"
                            value={priceRange.max}
                            onChange={(e) => updateQuery({ maxPrice: e.target.value })}
                            className="w-full bg-zinc-50 border-none p-6 rounded-[2rem] text-[14px] font-black text-black outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all shadow-inner"
                        />
                    </div>
                </div>
            );
        }

        if (activeFilterKey === 'availability') {
            return (
                <div className="space-y-3">
                    {[
                        { id: 'inStock', label: 'In Stock' },
                        { id: 'isNewArrival', label: 'New Drop' },
                        { id: 'isBestSeller', label: 'Best Seller' },
                        { id: 'isFlashSale', label: 'Flash Sale' }
                    ].map(flag => (
                        <button
                            key={flag.id}
                            onClick={() => updateQuery({ [flag.id]: !flags[flag.id as keyof typeof flags] })}
                            className={`flex items-center justify-between w-full px-6 py-6 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${flags[flag.id as keyof typeof flags]
                                ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 border-transparent text-black hover:border-zinc-100 hover:bg-white'}`}
                        >
                            {flag.label}
                            <Zap size={12} fill={flags[flag.id as keyof typeof flags] ? "white" : "transparent"} stroke={flags[flag.id as keyof typeof flags] ? "white" : "currentColor"} />
                        </button>
                    ))}
                </div>
            );
        }

        if (activeFilterKey.startsWith('spec_')) {
            const specKey = activeFilterKey.replace('spec_', '');
            const values = allAvailableSpecs[specKey] || [];
            return (
                <div className="grid grid-cols-1 gap-2">
                    {values.map(val => (
                        <button
                            key={val}
                            onClick={() => toggleSpec(specKey, val)}
                            className={`px-6 py-6 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all ${activeSpecs[specKey]?.includes(val)
                                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]'
                                : 'bg-zinc-50 text-black hover:bg-zinc-100'}`}
                        >
                            {val}
                        </button>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white min-h-screen pb-20 selection:bg-black selection:text-white">
            {/* --- CONDENSED SHOP HERO --- */}
            <section className="relative page-top pb-8 md:pb-12 px-6 bg-white w-full">
                <div className="container-responsive relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                {keyword ? (
                                    <>Search <span className="text-zinc-200">Results</span></>
                                ) : (
                                    <>The <span className="text-zinc-200">Collection</span></>
                                )}
                            </h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                                Studio Drops <span className="text-zinc-200">/</span> {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- MINIMALIST MNC TOOLBAR --- */}
            <nav className="sticky top-[104px] md:top-[120px] z-[90] px-4 md:px-8 py-2 transition-all duration-500 bg-white/95 backdrop-blur-2xl border-b border-zinc-100 w-full overflow-x-hidden shadow-sm">
                <div className="container-responsive flex items-center justify-between gap-2 md:gap-8">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hidden sm:block">
                            {products.length} Artifacts
                        </span>
                        <div className="h-4 w-px bg-zinc-100 hidden sm:block" />
                        <div className="relative group flex items-center">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="bg-transparent border-none py-1.5 px-0 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-0 transition-all placeholder:text-zinc-300 w-20 md:w-48"
                            />
                            <Search className="text-black group-focus-within:text-black transition-colors" size={12} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6 shrink-0">
                        {/* Sort Dropdown (MNC Style) */}
                        <div className="relative group flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Sort:</span>
                            <select
                                value={sort}
                                onChange={(e) => updateQuery({ sort: e.target.value })}
                                className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-[0.15em] pr-4 outline-none cursor-pointer text-zinc-900 border-none focus:ring-0"
                            >
                                <option value="newest">Latest</option>
                                <option value="price-asc">Price ↑</option>
                                <option value="price-desc">Price ↓</option>
                                <option value="rating">Rating</option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300" size={10} />
                        </div>

                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="flex items-center gap-2 md:gap-3 bg-black text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-900 transition-all duration-300 active:scale-95 shadow-xl shadow-black/10 shrink-0"
                        >
                            <SlidersHorizontal size={12} strokeWidth={3} />
                            Filter
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container-responsive pt-12">
                <Breadcrumbs items={[
                    { label: 'Shop', path: '/shop' },
                    ...(category !== 'All' ? [{ label: category, path: `/shop?category=${category}` }] : [])
                ]} />

                <div className="flex flex-col gap-8 mt-8 md:mt-16">
                    {/* --- MAIN GRID --- */}
                    <div className="flex-1">
                        <ActiveFilters 
                            category={category} setCategory={setCategory}
                            subcategory={subcategory} setSubcategory={setSubcategory}
                            filters={filters} setFilters={setFilters}
                            flags={flags} setFlags={setFlags}
                            priceRange={priceRange} setPriceRange={setPriceRange}
                            activeSpecs={activeSpecs} toggleSpec={toggleSpec}
                            resetFilters={resetFilters}
                        />
                        
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                                {[...Array(10)].map((_: any, i: number) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="aspect-square w-full rounded-[2rem]" />
                                        <Skeleton className="h-4 w-3/4 mx-auto rounded-full" />
                                        <Skeleton className="h-4 w-1/4 mx-auto rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-8 relative z-10">
                                {products.length > 0 ? (
                                    products.map((product: IProduct, idx: number) => (
                                        <div
                                            key={product._id}
                                            className="group/item animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
                                            style={{ animationDelay: `${idx * 20}ms` }}
                                        >
                                            <ProductCard product={product} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-60 text-center rounded-[4rem] bg-zinc-50/50 border border-zinc-100">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/5">
                                            <RotateCcw size={32} className="text-zinc-200 font-thin" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">No Artifacts Match</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-10">Refine your parameters to discover items</p>
                                        <button
                                            onClick={resetFilters}
                                            className="px-12 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl shadow-black/10"
                                        >
                                            Reset Catalog
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- LOAD MORE --- */}
                        {!loading && page < totalPages && (
                            <div className="mt-20 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <div className="h-px w-24 bg-zinc-100" />
                                <button
                                    onClick={() => updateQuery({ page: page + 1 })}
                                    disabled={loadingMore}
                                    className="px-16 py-5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
                                >
                                    {loadingMore ? (
                                        <>
                                            <RotateCcw size={14} className="animate-spin" />
                                            Calibrating...
                                        </>
                                    ) : (
                                        <>
                                            Explore More Artifacts
                                            <ChevronDown size={14} />
                                        </>
                                    )}
                                </button>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Showing {products.length} of {totalPages * 20} Artifacts
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- FILTER DRAWER (ELITE BLACK THEME) --- */}
                <div
                    className={`fixed inset-0 z-[150] transition-visibility duration-300 ${isDrawerOpen ? 'visible' : 'invisible'}`}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/70 backdrop-blur-xl transition-opacity duration-500 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setIsDrawerOpen(false)}
                    />

                    {/* Sidebar */}
                    <div
                        className={`absolute top-0 right-0 w-full max-w-[560px] h-full bg-white text-black shadow-[0_0_100px_rgba(0,0,0,0.1)] transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <div className="flex items-center justify-between p-6 md:p-10 pb-0 md:pb-0">
                            <div>
                                <h2 className="!text-2xl md:!text-3xl font-bold uppercase tracking-tighter text-black leading-none">Filter</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-px w-6 bg-zinc-100" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Refine Selection</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-full hover:bg-black hover:text-white transition-all hover:rotate-90 flex items-center justify-center border border-zinc-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden border-t border-zinc-200 mt-10">
                            {/* Left Pane: Attribute Groups */}
                            <div className="w-[120px] md:w-[180px] bg-zinc-50/50 border-r border-zinc-200 overflow-y-auto no-scrollbar py-2">
                                {filterGroups.map(group => {
                                    const preview = getSelectedValuePreview(group.id);
                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => setActiveFilterKey(group.id)}
                                            className={`w-full px-6 py-8 text-left relative transition-all duration-300 ${activeFilterKey === group.id 
                                                ? 'bg-white text-black shadow-[inset_-4px_0_0_#000]' 
                                                : 'text-black hover:bg-white/50'}`}
                                        >
                                            <span className={`font-black uppercase tracking-[0.25em] leading-tight block ${activeFilterKey === group.id ? 'text-[10px] md:text-[11px]' : 'text-[9px] md:text-[10px]'}`}>
                                                {group.label}
                                            </span>
                                            {preview && (
                                                <p className="text-[9px] font-bold text-pink-500 mt-2 truncate lowercase tracking-widest max-w-[90%]">
                                                    {preview}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Pane: Values Selection */}
                            <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto no-scrollbar">
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    {renderValues()}
                                </div>
                            </div>
                        </div>

                        <div className="flex border-t border-zinc-200 mt-auto bg-white">
                            <div className="w-[120px] md:w-[180px] border-r border-zinc-200 flex items-center justify-center p-2">
                                <button
                                    onClick={resetFilters}
                                    className="w-full py-4 text-[11px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all active:scale-95"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex-1 p-2 md:p-3">
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="w-full py-5 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                                >
                                    <span>Show {products.length} {products.length === 1 ? 'Item' : 'Items'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
