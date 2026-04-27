'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from './shared/Price';

interface QuickViewProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

const QuickView: React.FC<QuickViewProps> = ({ product, isOpen, onClose }) => {
    const addItem = useCartStore(state => state.addItem);
    const { success, error } = useToast();
    const router = useRouter();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeImg, setActiveImg] = useState(resolveMediaURL(product?.image));

    useEffect(() => {
        if (product) {
            setActiveImg(resolveMediaURL(product.image));
            if (product.variants?.length > 0) {
                setSelectedColor(product.variants[0].color);
                setSelectedSize(product.variants[0].size);
            }
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            const variant = product.variants?.find((v: any) => v.size === selectedSize && v.color === selectedColor);

            await addItem({
                _id: product._id,
                product: product._id,
                name: product.name || 'Unnamed Artifact',
                price: Number(variant?.price || product.price || 0),
                image: resolveMediaURL(variant?.image || product.image) || "/placeholder.jpg",
                selectedVariant: variant || undefined,
                quantity: 1
            });

            success(`Added ${product.name} to bag`);
            onClose();
        } catch (err) {
            error("Failed to add to bag");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* OVERLAY */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* MODAL */}
            <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-2">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 bg-black/5 hover:bg-black text-black hover:text-white rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                {/* IMAGE SECTION */}
                <div className="relative aspect-square md:aspect-auto h-full bg-zinc-50">
                    <img
                        src={activeImg || "/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-all duration-700"
                    />
                    {product.countInStock === 0 && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* INFO SECTION */}
                <div className="p-8 md:p-12 flex flex-col justify-center space-y-6 overflow-y-auto max-h-[80vh] md:max-h-none">
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Quick View</h2>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">{product.name}</h1>
                        <Price amount={product.price} className="text-xl font-black" />
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">
                        {product.description}
                    </p>

                    {/* VARIANTS */}
                    {product.variants?.length > 0 && (
                        <div className="space-y-4">
                            {/* COLORS */}
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Color</p>
                                <div className="flex flex-wrap gap-2">
                                    {[...new Set(product.variants.map((v: any) => v.color) as string[])].map((color, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                const v = product.variants.find((v: any) => v.color === color);
                                                if (v?.image) setActiveImg(resolveMediaURL(v.image));
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedColor === color ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-600 border-zinc-100 hover:border-black'}`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SIZES */}
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Size</p>
                                <div className="flex flex-wrap gap-2">
                                    {[...new Set(product.variants.filter((v: any) => v.color === selectedColor).map((v: any) => v.size) as string[])].map((size, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[40px] h-10 px-2 rounded-xl text-[10px] font-black border transition-all ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-600 border-zinc-100 hover:border-black'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleAddToCart}
                            disabled={loading || product.countInStock === 0}
                            className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:bg-zinc-200 disabled:shadow-none"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <ShoppingBag size={16} />
                                    Add to Bag
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => { onClose(); router.push(`/product/${product.slug}`); }}
                            className="w-full text-center text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                        >
                            View Full Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickView;
