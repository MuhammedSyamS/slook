'use client';

import React, { useState } from 'react';
import { Truck, Search, ArrowRight, ShieldCheck, RotateCcw, AlertCircle, CheckCircle, Package, X, Loader2, ChevronRight } from 'lucide-react';
import { client as api } from '@/lib/api/client';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { resolveMediaURL } from '@/utils/mediaUtils';
import Price from '@/components/shared/Price';
import { motion, AnimatePresence } from 'framer-motion';

export const ReturnPortalView = () => {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [comment, setComment] = useState('');
    const [returnType, setReturnType] = useState<'Return' | 'Exchange'>('Return');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [variants, setVariants] = useState<Record<string, any[]>>({});
    const [selectedExchangeVariants, setSelectedExchangeVariants] = useState<Record<string, any>>({});
    const [variantsLoading, setVariantsLoading] = useState<Record<string, boolean>>({});

    const { success, error: toastError, info } = useToast();
    const { user } = useAuthStore();
    const router = useRouter();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const newImages = [...images];
            for (const file of files) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                const { data } = await api.post('/upload', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newImages.push(data.filePath);
            }
            setImages(newImages);
            success(`Attached ${files.length} file(s)`);
        } catch (err) {
            console.error("Upload failed", err);
            toastError("Failed to process files");
        } finally {
            setUploading(false);
        }
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setOrder(null);
        setSelectedItems([]);
        setImages([]);
        setSuccessMsg('');
        try {
            const { data } = await api.get(`/orders/lookup?id=${orderId}&email=${email}`);
            setOrder(data);

            const deliveryDate = data.deliveredAt ? new Date(data.deliveredAt) : new Date(data.createdAt);
            const daysDiff = (new Date().getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7 && data.orderStatus === 'Delivered') {
                toastError("Return period expired (7 days from delivery)");
            } else {
                success("Order Synchronized!");
            }
        } catch (err: any) {
            toastError(err.response?.data?.message || "Order not found or not eligible");
        } finally {
            setLoading(false);
        }
    };

    const toggleItemSelection = async (itemId: string) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
            if (returnType === 'Exchange') {
                fetchVariantsForItem(itemId);
            }
        }
    };

    const fetchVariantsForItem = async (itemId: string) => {
        if (variants[itemId]) return;
        setVariantsLoading(prev => ({ ...prev, [itemId]: true }));
        try {
            const item = order.items.find((it: any) => it._id === itemId);
            const pId = item.product?._id || item.product;
            const { data } = await api.get(`/products/${pId}/variants`);
            setVariants(prev => ({ ...prev, [itemId]: data.filter((v: any) => v.stock > 0) }));
        } catch (err) {
            toastError("Failed to fetch variations");
        } finally {
            setVariantsLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleSubmitReturn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            info("Authorization Required to Verify Ownership");
            router.push(`/login?redirect=/returns-portal`);
            return;
        }

        if (selectedItems.length === 0) {
            toastError("Select at least one component");
            return;
        }

        const isDamaged = reason === 'Damaged Product' || reason === 'Wrong Item Received';
        if (isDamaged && images.length === 0) {
            toastError("Unboxing payload required for damaged items");
            return;
        }

        setLoading(true);
        try {
            const promises = selectedItems.map(itemId => {
                return api.post('/returns', {
                    orderId: order._id,
                    itemId,
                    reason,
                    comment,
                    type: returnType,
                    images: images,
                    requestedVariant: selectedExchangeVariants[itemId] || null
                });
            });

            await Promise.all(promises);

            setSuccessMsg("Return Request Dispatched Successfully!");
            setSelectedItems([]);
            setOrder(null);
            setImages([]);
            success("Return Protocol Initiated");

        } catch (err: any) {
            toastError(err.response?.data?.message || "Failed to initiate return");
        } finally {
            setLoading(false);
        }
    };

    const returnableItems = order?.items?.filter((item: any) =>
        !['Return Requested', 'Returned', 'Exchange Requested', 'Exchanged'].includes(item.status)
    ) || [];

    return (
        <div className="bg-white min-h-screen pt-40 md:pt-48 pb-32 px-6 selection:bg-black selection:text-white">
            <div className="max-w-xl mx-auto">
                <AnimatePresence mode="wait">
                    {successMsg ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-50 p-12 md:p-20 rounded-[3rem] md:rounded-[4rem] text-center border border-zinc-100"
                        >
                            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-6">Manifest Received</h2>
                            <p className="text-zinc-500 text-sm md:text-base font-medium mb-10 leading-loose uppercase tracking-widest">Your return protocol has been logged. Trace instructions sent to your neural link.</p>
                            <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase underline tracking-[0.3em] hover:text-zinc-400 p-4">Process Another</button>
                        </motion.div>
                    ) : !order ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full space-y-16"
                        >
                            <div className="text-center space-y-6">
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">
                                    RECOVERY <span className="text-zinc-200">PORTAL</span>
                                </h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Inventory reversal & exchange synchronization</p>
                            </div>

                            <form onSubmit={handleLookup} className="space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Order Identifier</label>
                                    <input
                                        type="text"
                                        placeholder="TRACE CODE"
                                        required
                                        value={orderId}
                                        onChange={e => setOrderId(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-sm font-black uppercase tracking-widest outline-none focus:border-black transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Secure Email</label>
                                    <input
                                        type="email"
                                        placeholder="USER@COLLECTIVE.COM"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-sm font-black uppercase tracking-widest outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "SEARCHING FREQUENCIES..." : "LOCATE ARTIFACT"}
                                    {!loading && <ArrowRight size={18} />}
                                </button>
                            </form>

                            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex items-start gap-6">
                                <AlertCircle className="text-black shrink-0 mt-1" size={20} />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                                    Protocol: Items eligible for reversal within 7 solar cycles. Artifacts must be in original manifest state with tags. Payload verification required for damaged assets.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-zinc-100 shadow-2xl"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic">Select Assets</h2>
                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-1">Order #{order._id.slice(-8).toUpperCase()}</p>
                                </div>
                                <button onClick={() => setOrder(null)} className="text-[10px] font-black uppercase underline tracking-widest hover:text-black text-zinc-400">Switch Trace</button>
                            </div>
                            
                            <form onSubmit={handleSubmitReturn} className="space-y-12">
                                <div className="space-y-4">
                                    {returnableItems.map((item: any) => {
                                        const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
                                        const daysDiff = (new Date().getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
                                        const isExpired = daysDiff > 7 && order.orderStatus === 'Delivered';

                                        return (
                                            <div key={item._id} className="space-y-4">
                                                <label className={`flex items-start gap-6 p-6 rounded-[2rem] border transition-all cursor-pointer ${isExpired ? 'opacity-40 cursor-not-allowed bg-zinc-50 border-zinc-100' : selectedItems.includes(item._id) ? 'border-black bg-zinc-50 scale-[1.02]' : 'border-zinc-100 hover:border-zinc-200'}`}>
                                                    <div className="pt-2">
                                                        <input
                                                            type="checkbox"
                                                            disabled={isExpired}
                                                            className="w-5 h-5 accent-black rounded cursor-pointer"
                                                            checked={selectedItems.includes(item._id)}
                                                            onChange={() => !isExpired && toggleItemSelection(item._id)}
                                                        />
                                                    </div>
                                                    <img src={resolveMediaURL(item.image)} alt="" className="w-16 h-20 object-cover rounded-2xl bg-zinc-100 shadow-sm" />
                                                    <div className="flex-1 min-w-0 py-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-black text-[11px] uppercase tracking-tight truncate italic">{item.name}</p>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">QTY: {item.qty} | SIZE: {item.selectedVariant?.size || 'UNIFIED'}</p>
                                                        <p className="text-sm font-black mt-2 italic">₹{item.price}</p>
                                                    </div>
                                                    {isExpired && <span className="text-[8px] font-black bg-red-100 text-red-600 px-3 py-1.5 rounded-full uppercase tracking-tighter">CYCLE EXPIRED</span>}
                                                </label>

                                                {returnType === 'Exchange' && selectedItems.includes(item._id) && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="ml-14 p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100"
                                                    >
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4 block italic">Request Replacement Specification</label>
                                                        {variantsLoading[item._id] ? (
                                                            <div className="flex items-center gap-3 py-2">
                                                                <Loader2 size={14} className="animate-spin" />
                                                                <span className="text-[9px] font-black uppercase text-zinc-400">Scanning Variants...</span>
                                                            </div>
                                                        ) : !variants[item._id] || variants[item._id].length === 0 ? (
                                                            <p className="text-[9px] font-black text-red-500 uppercase">SPECIFICATIONS DEPLETED</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-3">
                                                                {variants[item._id].map((v, vIdx) => (
                                                                    <button
                                                                        key={vIdx}
                                                                        type="button"
                                                                        onClick={() => setSelectedExchangeVariants((prev: any) => ({ ...prev, [item._id]: v }))}
                                                                        className={`px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedExchangeVariants[item._id] === v ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 text-zinc-500 hover:border-black'}`}
                                                                    >
                                                                        {v.size} {v.color && `(${v.color})`}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedItems.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-10 pt-6"
                                    >
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Reversal protocol</label>
                                            <div className="flex gap-4">
                                                {['Return', 'Exchange'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setReturnType(type as any)}
                                                        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border transition-all ${returnType === type ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-zinc-300 border-zinc-100'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Reason for failure</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-black appearance-none cursor-pointer italic"
                                                >
                                                    <option value="">SELECT SOURCE OF ERROR</option>
                                                    <option value="Size Issue">Dimensional Mismatch (Size)</option>
                                                    <option value="Damaged Product">Structural Failure (Damaged)</option>
                                                    <option value="Wrong Item Received">Manifest Error (Wrong Item)</option>
                                                    <option value="Quality Issue">Tactile Substandard (Quality)</option>
                                                    <option value="Changed Mind">Protocol Adjustment (Changed Mind)</option>
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300">
                                                    <ChevronRight size={18} className="rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Payload Verification (Images/Video)</label>
                                            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl p-10 text-center transition-all hover:bg-white hover:border-black group relative cursor-pointer">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,video/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="flex flex-col items-center gap-4 relative z-0">
                                                    <div className={`p-4 rounded-full ${uploading ? 'bg-zinc-100 animate-pulse' : 'bg-white shadow-xl group-hover:bg-black group-hover:text-white transition-all'}`}>
                                                        <RotateCcw size={24} className={uploading ? 'animate-spin' : ''} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest">
                                                            {uploading ? 'Analyzing Payload...' : 'Inject Proof Manifest'}
                                                        </p>
                                                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-mega">MAX 5MB · 4K CAPABLE</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {images.length > 0 && (
                                                <div className="flex gap-4 mt-6 overflow-x-auto pb-4 no-scrollbar">
                                                    {images.map((img, idx) => (
                                                        <div key={idx} className="w-24 h-24 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 relative group shadow-sm">
                                                            <img src={resolveMediaURL(img)} className="w-full h-full object-cover" alt="Verification" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                                                className="absolute top-2 right-2 bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 ml-1">Internal Notes</label>
                                            <textarea
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                placeholder="DESCRIBE DISCREPANCY..."
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-6 text-xs font-black uppercase tracking-widest outline-none focus:border-black h-32 resize-none placeholder:text-zinc-200 italic"
                                            ></textarea>
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={loading || uploading}
                                            className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] hover:bg-zinc-800 transition-all shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? "PROCESSING..." : `CONFIRM ${returnType} PROTOCOL`}
                                        </button>
                                    </motion.div>
                                )}
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
