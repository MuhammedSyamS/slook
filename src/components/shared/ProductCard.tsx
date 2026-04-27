'use client';

import React, { useState, useRef, memo } from 'react';
import Link from 'next/link';
import SafeImage from './SafeImage';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useToast } from '@/context/ToastContext';
import { Heart, Loader2, Star, Zap, Plus, Minus, X, ShoppingBag, Eye } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from './Price';

interface ProductCardProps {
  product: any;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product, onAddToCart }) => {
  const user = useAuthStore(state => state.user);
  const wishlist = useAuthStore(state => state.wishlist);
  const toggleWishlist = useAuthStore(state => state.toggleWishlist);
  const addItem = useCartStore(state => state.addItem);
  const cartItems = useCartStore(state => state.items);
  const flashSale = useUIStore(state => state.flashSale);
  
  const router = useRouter();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isTouchHovered, setIsTouchHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(resolveMediaURL(product.image) || "/placeholder.jpg");
  const touchStartRef = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    setImgSrc(resolveMediaURL(product.image) || "/placeholder.jpg");
  }, [product.image]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    if (deltaX > 15 && deltaX > deltaY) {
      if (!isTouchHovered) setIsTouchHovered(true);
    } else if (deltaY > 10 && deltaY > deltaX) {
      if (isTouchHovered) setIsTouchHovered(false);
    }
  };

  const handleTouchEnd = () => {
    if (isTouchHovered) {
      setTimeout(() => setIsTouchHovered(false), 2500);
    }
  };

  if (!product?._id) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const stockInfo = product.countInStock ?? product.stock ?? product.qty ?? null;

  const totalVariantStock = hasVariants
    ? product.variants.reduce((sum: number, v: any) => sum + Number(v.stock || v.countInStock || v.qty || 0), 0)
    : stockInfo;

  const isOutOfStock = hasVariants 
    ? totalVariantStock <= 0 
    : (totalVariantStock !== null && totalVariantStock <= 0);

  const { isFlashSale, finalPrice, salePrice } = React.useMemo(() => {
    const isFS = Array.isArray(flashSale?.products) && flashSale.products.some((p: any) => (p._id || p) === product._id);
    const sPrice = isFS && flashSale ? Math.round(product.price * (1 - ((flashSale as any).discountPercentage || 0) / 100)) : null;
    return {
      isFlashSale: isFS,
      salePrice: sPrice,
      finalPrice: isFS ? sPrice! : product.price
    };
  }, [flashSale, product._id, product.price]);

  const isFav = React.useMemo(() => {
    const list = user ? (user.wishlist || []) : wishlist;
    return list.some((i: any) => (i?._id || i)?.toString() === product._id?.toString());
  }, [user, wishlist, product._id]);

  const inCart = React.useMemo(() => {
    return (cartItems || []).some(item => (item.product || item._id).toString() === product._id.toString());
  }, [cartItems, product._id]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { error("Please login to save favorites"); return router.push('/login'); }
    setLoading(true);
    try {
      await toggleWishlist(product);
    } catch (err) { 
      error("Failed to update wishlist"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdd = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (inCart) return;

    if (hasVariants && !selectedSize && !showQuickAdd) { 
        setShowQuickAdd(true); 
        return; 
    }

    if (!user) { error("Please login to shop"); return router.push('/login'); }

    setCartLoading(true);
    try {
      const variantData = hasVariants
        ? product.variants.find((v: any) => v.size === (selectedSize || product.variants[0].size)) || product.variants[0]
        : undefined;

      await addItem({
        _id: product._id,
        product: product._id,
        name: product.name || 'Unnamed Artifact',
        price: Number(finalPrice) || 0,
        image: resolveMediaURL(product.image) || "/placeholder.jpg",
        quantity: 1,
        selectedVariant: variantData
      });

      setShowQuickAdd(false);
      success(`Added to bag`);
      if (onAddToCart) onAddToCart();
    } catch (err) { 
      error("Failed to add to bag"); 
    } finally { 
      setCartLoading(false); 
    }
  };

  return (
    <div
      className="relative w-[258px] group mx-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-[258px] h-[323px] overflow-hidden bg-white border border-zinc-100 rounded-2xl shadow-sm">
        <div className="absolute inset-0 z-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.15)]" />

        <Link href={`/product/${product.slug || product._id}`} className="block w-full h-full relative">
          <SafeImage
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
            loading="lazy"
            draggable={false}
          />
        </Link>

        {isFlashSale && (
          <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1.5 z-10">
            <p className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor" /> Flash Sale</p>
          </div>
        )}
        
        {product.badge && (
          <div className="absolute top-0 left-0 bg-black text-white px-3 py-1.5 z-10">
            <p className="text-[8px] font-black uppercase tracking-widest">{product.badge}</p>
          </div>
        )}

        {product.tags && product.tags.length > 0 && product.tags.filter((t: string) => t !== product.badge).slice(0, 1).map((tag: string, idx: number) => (
          <div key={idx} className={`absolute text-white px-3 py-1.5 z-10 ${product.badge ? 'top-8 left-0 bg-zinc-800' : 'top-0 left-0 bg-black'}`}>
            <p className="text-[8px] font-black uppercase tracking-widest">{tag}</p>
          </div>
        ))}

        {!isOutOfStock && (product.countInStock < 5 || product.variants?.some((v: any) => Number(v.stock ?? 0) > 0 && Number(v.stock ?? 0) < 5)) && (
          <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1.5 z-10">
            <p className="text-[8px] font-black uppercase tracking-widest">Low Stock</p>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
          </div>
        )}

        <div className="absolute top-2 right-2 z-30 flex flex-col gap-2">
          <button
            onClick={handleWishlistClick} disabled={loading}
            className="p-1.5 rounded-full bg-white/90 shadow hover:bg-white active:scale-90 transition-all"
          >
            {loading ? <Loader2 size={14} className="animate-spin text-zinc-400" />
              : <Heart size={14} fill={isFav ? "black" : "none"} className="text-black" />}
          </button>
          
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/product/${product.slug || product._id}`); }}
            className="p-1.5 rounded-full bg-white/90 shadow hover:bg-white active:scale-90 transition-all duration-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Eye size={14} className="text-black" />
          </button>
        </div>

        {showQuickAdd && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-40 p-4 flex flex-col justify-end">
            <button onClick={e => { e.stopPropagation(); setShowQuickAdd(false); }} className="absolute top-2 right-2 text-white/50 hover:text-white">
              <X size={18} />
            </button>
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Select Size</p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(product.variants.map((v: any) => v.size))].map((size: any) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-[10px] font-black border transition-all ${selectedSize === size ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/20'}`}>
                    {size}
                  </button>
                ))}
              </div>
              <button onClick={() => handleAdd()} disabled={cartLoading || !selectedSize}
                className="w-full bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2">
                {cartLoading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {!showQuickAdd && (
          <div
            className={`absolute bottom-0 left-0 w-full z-20 bg-black text-white transition-all duration-500 ease-out opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 ${isTouchHovered ? '!opacity-100 !translate-y-0' : ''}`}
          >
            <button
              onClick={() => handleAdd()}
              disabled={cartLoading || isOutOfStock}
              className="w-full h-11 text-[9px] font-black uppercase tracking-[0.15em] hover:bg-zinc-900 disabled:opacity-50"
            >
              {isOutOfStock ? 'Out of Stock' : cartLoading ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Add to Bag'}
            </button>
          </div>
        )}
      </div>

      <div className="px-1 text-center mt-3">
        <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-tight mb-0.5 truncate">{product.name}</h3>
        <div className="flex items-center justify-center gap-2">
          {isFlashSale ? (
            <>
              <Price amount={salePrice!} className="text-[11px] md:text-[12px] font-black text-red-600" />
              <Price amount={product.price} className="text-[9px] text-zinc-400 line-through" />
            </>
          ) : (
            <Price amount={product.price} className="text-[11px] md:text-[12px] font-black" />
          )}
        </div>
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={9}
              fill={i < Math.round(product.rating || 0) ? "black" : "transparent"}
              className={i < Math.round(product.rating || 0) ? "text-black" : "text-zinc-300"} />
          ))}
          <span className="text-[8px] font-bold text-zinc-400 ml-0.5">({product.numReviews || 0})</span>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;